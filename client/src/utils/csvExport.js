export function exportToCSV(data, filename = 'throttlex-export.csv') {
  if (!data || !data.length) {
    alert('No data available to export.');
    return;
  }

  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers.map((header) => {
      let val = obj[header] === null || obj[header] === undefined ? '' : obj[header];
      if (typeof val === 'string') {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',')
  );

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
