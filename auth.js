// auth.js

const accessLink = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTTbDQd-4UsURpYylaWZODHbhIOFHMOysZJ7b1r10r0Vb1Y2fKYxO7HLJmSpAqzYFLJF4zA1CPmpLbM/pub?output=csv'
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


document.addEventListener('DOMContentLoaded', () => {

    const loginModal = document.getElementById('loginModal');
    const content = document.getElementById('content');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');

    // Function to validate token based on CSV data
    async function validateToken() {
        const storedUsername = localStorage.getItem('username');
        const tokenExpiry = localStorage.getItem('tokenExpiry');

        if (!storedUsername || !tokenExpiry) {
            return false;
        }

        const now = new Date();
        const expiryDate = new Date(tokenExpiry);

        // Check if token expiry date is valid
        if (now >= expiryDate) {
            return false;
        }

        try {
            // Fetch CSV data as JSON
            const userList = await fetchCSVAsJSON(accessLink);

            // Check if the user exists in the fetched list and verify the token expiry date with the limit field
            const user = userList.find(u => u.name === storedUsername);

            if (user && parseDateString(user.limit) >= now) {
                return true;
            }

            return false;
        } catch (error) {
            console.error("Error validating token:", error);
            return false;
        }
    }

    // Function to check if the user is authenticated
    async function isAuthenticated() {
        validateToken().then(res => {
            if (res) {
                loginModal.classList.add('hidden');
                loadChartScript();
            } else {
                loginModal.classList.remove('hidden');
            }
        })
    }
    isAuthenticated()

    // Function to dynamically load chart.js only if authenticated
    function loadChartScript() {
        content.classList.remove('hidden');

        const script = document.createElement('script');
        script.src = 'chart.js';
        script.onload = () => {
            console.log('Chart script loaded.');
        };
        document.body.appendChild(script);
    }


    // Parse a date in DD/MM/YYYY format into a JavaScript Date object
    function parseDateString(dateString) {
        const [day, month, year] = dateString.split("/").map(Number);
        // JavaScript Date expects the month to be 0-indexed (January is 0, February is 1, etc.)
        return new Date(year, month - 1, day);
    }

    // Handle login click event
    loginButton.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {

            // Fetch CSV data as JSON
            const userList = await fetchCSVAsJSON(accessLink);

            // Validate the username and password against the fetched data
            const user = userList.find(u => u.name === username && u.password === password);

            if (user) {
                // Set the expiry date based on the CSV limit field
                const expiryDate = parseDateString(user.limit);

                // Check if the parsed date is valid
                if (isNaN(expiryDate.getTime())) {
                    console.error("Invalid limit date format in the CSV");
                    loginError.classList.remove('hidden');
                    return;
                }
                localStorage.setItem('username', user.name);
                localStorage.setItem('tokenExpiry', expiryDate.toISOString());

                // Hide login modal and show content
                loginModal.classList.add('hidden');
                loadChartScript();
            } else {
                loginError.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error during login:", error);
            loginError.classList.remove('hidden');
        }
    });

    // Handle logout click event
    logoutButton.addEventListener('click', () => {
        // Clear the token and expiry, show login modal, and hide content
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        content.classList.add('hidden');
        loginModal.classList.remove('hidden');
        loginModal.classList.add('visible');
    });

    // Validate token every 30 minutes
    setInterval(async () => {
        if (!(await isAuthenticated())) {
            // Clear the token and expiry, show login modal, and hide content
            localStorage.removeItem('username');
            localStorage.removeItem('tokenExpiry');

            // Hide the content and show the login modal again
            content.classList.add('hidden');
            loginModal.classList.remove('hidden');
            loginModal.classList.add('visible');
        }
    }, 30 * 60 * 1000); // 30 minutes in milliseconds

});