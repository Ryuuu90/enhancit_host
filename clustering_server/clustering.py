from fastapi import FastAPI, HTTPException
from typing import List, Dict, Any
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from scipy.stats import zscore
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
origins = [
    "*"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/clustering")
async def analyze(data: List[Dict[str, Any]]):
    for entry in data:
        scores = entry.pop("Scores", {})
        entry["Score-Pr"] = scores.get("PR")
        entry["Score-Co"] = scores.get("CO")
        entry["Score-Op"] = scores.get("OP")
        entry["Score-Ad"] = scores.get("AD")
        entry["Score-Ci"] = scores.get("CI")

    df = pd.DataFrame(data)
    kpi_columns = ['Score-Pr', 'Score-Co', 'Score-Op', 'Score-Ad', 'Score-Ci']

    kpi_data = df[kpi_columns].dropna()
    df_valid = df.loc[kpi_data.index].copy()
    kpi_columns = ['Score-Pr', 'Score-Co', 'Score-Op', 'Score-Ad', 'Score-Ci', 'KBICONSO']
    for col in kpi_columns:
        df_valid[f'{col}_decile'] = pd.qcut(df[col], q=10, labels=False, duplicates='drop') + 1  # 1 to 10
    for col in kpi_columns:
        df_valid[f'{col}_quartiles'] = pd.qcut(df[col], q=4, labels=False, duplicates='drop') + 1  # 1 to 4

    Q1 = kpi_data.quantile(0.25)
    Q3 = kpi_data.quantile(0.75)
    IQR = Q3 - Q1
    outlier_mask_Q = ((kpi_data < (Q1 - 1.5 * IQR)) | (kpi_data > (Q3 + 1.5 * IQR))).any(axis=1)
    z_scores = pd.DataFrame(zscore(kpi_data), columns=kpi_data.columns)
    outlier_mask = (z_scores.abs() > 3).any(axis=1)

    inliers_mask = (~outlier_mask_Q | ~outlier_mask)
    inliers_data = kpi_data[inliers_mask]

    if len(inliers_data) < 3:
        raise HTTPException(status_code=400, detail="Not enough valid data points to perform clustering.")

    silhouette_scores = []
    for k in range(3, 10):
        if len(inliers_data) < k:
            silhouette_scores.append(-1)
            continue
        kmeans = KMeans(n_clusters=k, random_state=42)
        labels = kmeans.fit_predict(inliers_data)
        silhouette_scores.append(silhouette_score(inliers_data, labels))

    best_k_index = silhouette_scores.index(max(silhouette_scores))
    best_k = range(3, 10)[best_k_index]

    kmeans = KMeans(n_clusters=best_k, random_state=42)
    if len(inliers_data) < best_k:
        labels = [0] * len(inliers_data)
    else:
        labels = kmeans.fit_predict(inliers_data)

    # Assign clusters, default all to "Outlier"
    df_valid['Cluster_Q'] = "Outlier"
    df_valid.loc[inliers_data.index, 'Cluster_Q'] = labels

    # Mark clusters with fewer than 8 points as Outlier
    print(len(inliers_data))
    points_numc = (len(inliers_data)/ best_k) / 2
    print(points_numc)
    cluster_counts = df_valid.loc[inliers_data.index].groupby('Cluster_Q').size()
    small_clusters = cluster_counts[cluster_counts < points_numc].index.tolist()
    mask_small_clusters = df_valid['Cluster_Q'].isin(small_clusters)
    df_valid.loc[mask_small_clusters, 'Cluster_Q'] = "Outlier"
    filtered_inliers_index = inliers_data.index.difference(df_valid[mask_small_clusters].index)
    filtered_inliers_data = inliers_data.loc[filtered_inliers_index]

    kpi_columns = ['Score-Pr', 'Score-Co', 'Score-Op', 'Score-Ad', 'Score-Ci', 'KBICONSO']
    cluster_profiles = (df_valid.groupby('Cluster_Q')[kpi_columns].mean() * 100).round(2).astype(str) + '%'

    demographic_columns = ['Age', 'Gender', 'Management']
    percentage_dfs = []

    for col in demographic_columns:
        percentages = (
            df_valid
            .groupby('Cluster_Q')[col]
            .value_counts(normalize=True)
            .unstack(fill_value=0)
        )
        percentages = (percentages * 100).round(2).astype(str) + '%'
        percentages.columns = [f"{col}_{val}_pct" for val in percentages.columns]
        percentage_dfs.append(percentages)

    demographic_percentages = pd.concat(percentage_dfs, axis=1)
    full_cluster_profile = pd.concat([cluster_profiles, demographic_percentages], axis=1)

    decile_columns = [f'{col}_decile' for col in kpi_columns]
    decile_dfs = []

    for col in decile_columns:
        decile_distribution = (
            df_valid
            .groupby('Cluster_Q')[col]
            .value_counts(normalize=True)
            .unstack(fill_value=0)
        )
        decile_distribution = (decile_distribution * 100).round(2).astype(str) + '%'
        decile_distribution.columns = [f"{col}_{int(val)}_pct" for val in decile_distribution.columns]
        decile_dfs.append(decile_distribution)

    kpi_decile_percentages = pd.concat(decile_dfs, axis=1)
    full_cluster_profile = pd.concat([full_cluster_profile, kpi_decile_percentages], axis=1)

    inliers_df = df_valid.loc[filtered_inliers_data.index]
    pca = PCA(n_components=2)
    pca_result = pca.fit_transform(filtered_inliers_data)
    inliers_df["PCA1"] = pca_result[:, 0]
    inliers_df["PCA2"] = pca_result[:, 1]

    corr_matrix = inliers_data.corr().round(2)

    output = {
        "pca": inliers_df[["PCA1", "PCA2", "Cluster_Q"]].to_dict(orient="records"),
        "clusterProfile": full_cluster_profile,
        "heatmap": {"data" : corr_matrix.values.tolist(), "x" : corr_matrix.columns.tolist(), "y" : corr_matrix.index.tolist()},
        "n_clusters": best_k
    }

    return output
