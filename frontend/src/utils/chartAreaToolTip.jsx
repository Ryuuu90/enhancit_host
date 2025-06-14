const chartAreaToolTip = (reportType = "company", normalDistributions, processAllData) => {
    return function ToolTip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;
    return (
    <div className=" flex flex-row justify-between w-6/12 flex-wrap bg-white p-1 border-solid" >
        {payload.map((entry, index) => {
        let stats;
        let title = '';
        
        if(entry.id === "sectorData")
        {
            stats = processAllData.secNormalDistributions[entry.name];
            title = `Score-${entry.name}`;
        }
        else if(entry.id)
        {
            stats = normalDistributions[entry.id];
            title = `${entry.name}`;
        }
        else
        {
            stats = processAllData.normalDistributions[entry.name];
            title = `Score-${entry.name}`;
        }
        return (
            <div key={index} className="mt-2">
            <div><strong> {title}: {(label * 100).toFixed(1)}%</strong></div>
            <div>Density: {(entry.value * 10).toFixed(1)}%</div>
            <div>StdDev: {(stats.stdDev * 100).toFixed(1)}%</div>
            <div>Mean: {(stats.mean * 100).toFixed(1)}%</div>
            <div>Median: {(stats.median * 100).toFixed(1)}%</div>
            <div>Variance: {(stats.variance * 100).toFixed(1)}%</div>
            {reportType !== "company" &&
            <div className="text-red-600"> {stats.idKpoint.x < stats.mean 
                ? ` ${entry.id ? entry.id : entry.name} = ${(stats.idKpoint.x * 100)}% is below the average` 
                : `${entry.id ? entry.id : entry.name} = ${stats.idKpoint.x * 100}% is above the average`}</div>}
            </div>
        );
        })}
    </div>
    );
}
}

export default chartAreaToolTip;