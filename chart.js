// chart.js



function transformData(data) {
    console.log(data)
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
        const level1 = findOrCreateNode(root, item.name || "Startups");
        const level2 = findOrCreateNode(level1, item.children__name || "Investors");
        const level3 = findOrCreateNode(level2, item.children__children__name || "Category");

        // Create the leaf node
        const leaf = {
            name: item.children__children__children__name,
            value: Number(item.children__children__children__value),
            link: item.children__children__children__link,
            description: item.children__children__children__description.replace(/"/g, ""),
        };
        console.log(leaf)
        // Add the leaf node to level 3
        level3.children.push(leaf);

    });

    return root;
}

function buildHierarchy(flatData) {
    const root = {};

    flatData.forEach(item => {
        let currentLevel = root;

        // Extract the hierarchy path for the current item
        const entries = Object.entries(item).filter(([key, value]) => value !== "");

        // Build the hierarchy for the current item
        entries.forEach(([fullKey, value]) => {
            const keys = fullKey.split('__');
            let obj = currentLevel;

            keys.forEach((key, index) => {
                const isLast = index === keys.length - 1;
                const nextKey = keys[index + 1];

                // Handle 'children' as arrays
                if (key === 'children') {
                    if (!obj[key]) obj[key] = [];
                    // Find existing child with the same name
                    let childNameKey = keys.slice(0, index + 2).join('__') + '__name';
                    let childName = item[childNameKey];

                    // For top-level 'children', use the 'name' key from the current object if 'childName' is undefined
                    if (!childName && item['name']) childName = item['name'];

                    // If name is still undefined, skip this iteration
                    if (!childName) return;

                    let child = obj[key].find(c => c.name === childName);
                    if (!child) {
                        child = { name: childName };
                        obj[key].push(child);
                    }
                    obj = child;
                } else {
                    // Assign value to the last key
                    if (isLast) {
                        obj[key] = value;
                    } else {
                        if (!obj[key]) obj[key] = {};
                        obj = obj[key];
                    }
                }
            });
        });
    });

    return root;
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
            link: item.link,
            description: item.description,
        };

        // Add the leaf node to level 2
        level2.children.push(leaf);
    });

    return root;
}



// Immediately Invoked Function Expression (IIFE) to avoid polluting the global namespace
(function () {
    // Chart Dimensions
    const width = 928;
    const height = width;
    const radius = width / 6;

    // Create the SVG container
    const svg = d3.select("#chart")
        .append("svg")
        .attr("viewBox", [-width / 2, -height / 2, width, width])
        .style("font", "10px sans-serif");

    // Create the tooltip
    const tooltip = d3.select(".tooltip");

    // Load the external data
    fetchCSVAsJSON(csvUrl).then(res => {
        const data = transformImprovedData(res)

        //fetchCSVAsJSON(csvUrl).then
        // Utility function to get maximum number of children at any level
        function getMaxChildren(data) {
            let max = 0;
            function recurse(node) {
                if (node.children) {
                    max = Math.max(max, node.children.length);
                    node.children.forEach(child => recurse(child));
                }
            }
            recurse(data);
            return max;
        }

        // Create the color scale
        const color = d3.scaleOrdinal(
            d3.quantize(d3.interpolateRainbow, getMaxChildren(data) + 1)
        );

        // Compute the layout
        const hierarchyData = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        let root = d3.partition()
            .size([2 * Math.PI, hierarchyData.height + 1])
            (hierarchyData);

        root.each(d => d.current = d);

        // Create the arc generator
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        // Append the arcs
        const path = svg.append("g")
            .selectAll("path")
            .data(root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                let current = d;
                while (current.depth > 1) current = current.parent;
                return color(current.data.name);
            })
            .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => arc(d.current))
            .attr("aria-label", d => `${d.data.name}: ${d.value}`)
            .attr("role", "img")
            .on("mouseover", (event, d) => {
                showTooltip(event, d);
            })
            .on("mouseout", hideTooltip);

        // Make arcs clickable if they have children
        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", clicked);

        // Add tooltips
        function showTooltip(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>${d.data.name}</strong></br>${d.data.description || ''}`)
            //.style("left", (event.pageX + 10) + "px")
            //.style("top", (event.pageY - 28) + "px");
        }

        function hideTooltip() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }

        // Add labels
        const label = svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .join("g")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +labelVisible(d.current))
            .attr("transform", d => labelTransform(d.current))
            .each(function (d) {
                if (d.data.link) {
                    const currentGroup = d3.select(this);
                    currentGroup.append("a")
                        .attr("xlink:href", d.data.link)
                        .attr("pointer-events", "auto")
                        .attr("target", "_blank")
                        .attr("dy", "0.35em")
                        .append("text")
                        .text(d => d.data.name);
                } else {
                    const currentGroup = d3.select(this);
                    currentGroup.append("text")
                        .text(d => d.data.name);
                }
            })


        // Add parent circle for zooming out
        const parent = svg.append("circle")
            .datum(root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .attr("aria-label", "Zoom Out")
            .attr("role", "button")
            .on("click", clicked)
            .on("mouseover", () => {
                showTooltipForParent();
            })
            .on("mouseout", hideTooltip);

        function showTooltipForParent() {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(`<strong>Startup Ecosystem</strong>`)
            //.style("left", (d3.event.pageX + 10) + "px")
            //.style("top", (d3.event.pageY - 28) + "px");
        }

        // Utility function to extract unique groups
        function getAllGroups(data) {
            const groups = [];
            function recurse(node) {
                if (node.children) {
                    node.children.forEach(child => {
                        if (child.name) {
                            groups.push(child.name);
                        }
                        recurse(child);
                    });
                }
            }
            recurse(data);
            return groups;
        }


        // Handle zoom on click
        function clicked(event, p) {
            parent.datum(p.parent || root);

            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });

            const t = svg.transition().duration(750);

            // Transition the arcs
            path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .filter(function (d) {
                    return +this.getAttribute("fill-opacity") || arcVisible(d.target);
                })
                .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
                .attr("pointer-events", d => arcVisible(d.target) ? "auto" : "none")
                .attrTween("d", d => () => arc(d.current));

            // Transition the labels
            label.filter(function (d) {
                return +this.getAttribute("fill-opacity") || labelVisible(d.target);
            })
                .transition(t)
                .attr("fill-opacity", d => +labelVisible(d.target))
                .attrTween("transform", d => () => labelTransform(d.current));
        }

        // Determine if an arc is visible (up to 5 layers)
        function arcVisible(d) {
            return d.y1 <= 5 && d.y0 >= 1 && d.x1 > d.x0;
        }

        // Determine if a label is visible (up to 5 layers)
        function labelVisible(d) {
            return d.y1 <= 5 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
        }

        // Transform labels
        function labelTransform(d) {
            const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            const y = (d.y0 + d.y1) / 2 * radius;
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }).catch(error => {
        console.error("Error loading the data file:", error);
    });
})();