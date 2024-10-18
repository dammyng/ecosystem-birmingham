// table.js

// Select the table body
const tableBody = document.getElementById('table-body');

// Select the search input
const searchInput = document.getElementById('search-input');

// Create the tooltip (optional for future enhancements)
const tooltip = d3.select("#tooltip");

// Load the external data
d3.json("data.json").then(data => {
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
    searchInput.addEventListener('input', function() {
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