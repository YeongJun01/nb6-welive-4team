import csv from 'csv-parser';

export function parseCsv(stream: NodeJS.ReadableStream): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = [];

    stream
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim(),
        }),
      )
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
