import fs from 'fs';

const suppliersData = JSON.parse(fs.readFileSync('public/firestore/suppliers_complete.json', 'utf8'));

let emptyMainCategory = 0;
let emptyCountry = 0;
let emptyTrainingNatureOfService = 0;
let allThreeEmpty = 0;

suppliersData.forEach(supplier => {
    const mainCategory = supplier.original?.['Supplier Main Category'] || '';
    const country = supplier.original?.['Country/Region (Street Address)'] || '';
    const trainingNature = supplier.original?.trainingNatureOfService || '';

    const hasEmptyMainCategory = !mainCategory || mainCategory.trim() === '';
    const hasEmptyCountry = !country || country.trim() === '';
    const hasEmptyTrainingNature = !trainingNature || trainingNature.trim() === '';

    if (hasEmptyMainCategory) emptyMainCategory++;
    if (hasEmptyCountry) emptyCountry++;
    if (hasEmptyTrainingNature) emptyTrainingNatureOfService++;
    if (hasEmptyMainCategory && hasEmptyCountry && hasEmptyTrainingNature) allThreeEmpty++;
});

console.log(`Total vendors: ${suppliersData.length}`);
console.log(`\nEmpty fields count:`);
console.log(`- Empty Main Category: ${emptyMainCategory} (${(emptyMainCategory/suppliersData.length*100).toFixed(1)}%)`);
console.log(`- Empty Country: ${emptyCountry} (${(emptyCountry/suppliersData.length*100).toFixed(1)}%)`);
console.log(`- Empty trainingNatureOfService: ${emptyTrainingNatureOfService} (${(emptyTrainingNatureOfService/suppliersData.length*100).toFixed(1)}%)`);
console.log(`\nVendors with all three fields empty: ${allThreeEmpty}`);