
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT8RZbr9wf1Z1U8r2ThApsH_QxPGoWODapgxsjUjs1TLKRKtDEZznKyPIZjvwhomePhXIpmapUaK9K5/pub?output=csv';
function fetchCSVAsJSON(csvUrl) {

    return fetch(csvUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            // Parse the CSV into an array of objects
            const rows = csvText.split('\n').filter(row => row.trim().length > 0); // Filter out empty rows
            const headers = rows[0].split(',').map(header => header.trim());

            // Convert CSV rows into JSON format
            const jsonData = rows.slice(1).map(row => {
                const values = row.split(',').map(value => value.trim());
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = values[i];
                });
                return obj;
            });

            return jsonData;
        })
        .catch(error => {
            console.error('Error fetching or parsing CSV:', error);
            return []; // Return an empty array in case of an error
        });
}

function transformImprovedData(data) {

    // Create the root object
    const root = {
        name: "Startup Ecosystem",
        children: []
    };

    // Helper function to find or create a node at a specific level
    function findOrCreateNode(parent, nodeName) {
        let node = parent.children.find(child => child.name === nodeName);
        if (!node) {
            node = {
                name: nodeName,
                children: []
            };
            parent.children.push(node);
        }
        return node;
    }

    // Iterate through each item in the input data array
    data.forEach(item => {
        // Find or create each level of the hierarchy
        const level1 = findOrCreateNode(root, item.category);
        const level2 = findOrCreateNode(level1, item.subcategory);

        // Create the leaf node
        const leaf = {
            name: item.name,
            value: Number(item.value),
            description: item.description
        };

        // Add the leaf node to level 2
        level2.children.push(leaf);
    });
    console.log(root)
    return root;
}

// table.js

// Select the table body
const tableBody = document.getElementById('table-body');

// Select the search input
const searchInput = document.getElementById('search-input');

// Create the tooltip (optional for future enhancements)
const tooltip = d3.select("#tooltip");

// Load the external data
// Load the external data
fetchCSVAsJSON(csvUrl).then(res => {
    const data = transformImprovedData(res)
    // Function to traverse the hierarchical data and generate table rows using for loops
    function traverse(node, category = '', subcategory = '') {
        if (node.name === 'Startup Ecosystem') {
            for (let i = 0; i < node.children.length; i++) {
                traverse(node.children[i]);
            }
        } else if (node.children) {
            const newCategory = node.name;
            for (let i = 0; i < node.children.length; i++) {
                traverse(node.children[i], newCategory, '');
            }
        } else {
            // Leaf node
            const row = document.createElement('tr');

            // Category Cell
            const categoryCell = document.createElement('td');
            categoryCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            categoryCell.textContent = category;
            row.appendChild(categoryCell);

            // Subcategory Cell
            const subcategoryCell = document.createElement('td');
            subcategoryCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            subcategoryCell.textContent = subcategory;
            row.appendChild(subcategoryCell);

            // Name Cell
            const nameCell = document.createElement('td');
            nameCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            nameCell.textContent = node.name;
            row.appendChild(nameCell);

            // Value Cell
            const valueCell = document.createElement('td');
            valueCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            valueCell.textContent = node.value;
            row.appendChild(valueCell);

            // Description Cell
            const descriptionCell = document.createElement('td');
            descriptionCell.className = 'px-6 py-4 whitespace-nowrap text-sm text-gray-900';
            descriptionCell.textContent = node.description;
            row.appendChild(descriptionCell);

            tableBody.appendChild(row);
        }
    }

    // Initialize table with data
    traverse(data);

    // Implement search functionality
    searchInput.addEventListener('input', function () {
        const query = this.value.toLowerCase();
        const rows = tableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].getElementsByTagName('td');
            let match = false;

            // Loop through each cell in the row
            for (let j = 0; j < cells.length; j++) {
                const cellText = cells[j].textContent.toLowerCase();
                if (cellText.includes(query)) {
                    match = true;
                    break;
                }
            }

            // Show or hide the row based on the match
            if (match) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    });
}).catch(error => {
    console.error("Error loading the data file:", error);
});