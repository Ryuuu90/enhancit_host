import React from 'react';

const FilterComponent = ({ filters, onFilterChange, uniqueValues, records }) => {
  const filterKeys = ['Department', 'Age', 'Gender', 'Phase', 'Maturity', 'Management'];

  return (
    <div className="mt-1 p-6 grid grid-cols-2 gap-6">
      {filterKeys.map((key) => (
        <div key={key}>
          <label className="block font-semibold text-white">{key}</label>
          <select 
            name={key} 
            value={filters[key]} 
            onChange={onFilterChange} 
            className="appearance-none bg-white w-full border p-2 rounded"
          >
            <option value="">All</option>
            {uniqueValues(key, records).map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export default FilterComponent;