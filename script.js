/* ------------------ ERROR POPUP ------------------ */
function showError(message) {
    const popup = document.getElementById("errorPopup");
    const msg = document.getElementById("errorMessage");

    msg.textContent = message;
    popup.classList.remove("hidden");

    setTimeout(() => popup.classList.add("show"), 10);

    setTimeout(() => {
        popup.classList.remove("show");
        setTimeout(() => popup.classList.add("hidden"), 500);
    }, 3000);
}

/* ------------------ CHECK IF ROW IS FILLED ------------------ */
function isRowFilled(row) {
    const inputs = row.getElementsByTagName("input");
    return (
        inputs[0].value.trim() !== "" &&
        inputs[1].value.trim() !== "" &&
        inputs[8].value.trim() !== "" &&
        inputs[9].value.trim() !== ""
    );
}

/* ------------------ DUPLICATE ROLL CHECK ------------------ */
function isDuplicateRoll(roll) {
    const tbody = document.getElementById("attendanceTable").getElementsByTagName("tbody")[0];
    const rows = Array.from(tbody.getElementsByTagName("tr"));

    let count = 0;
    rows.forEach(row => {
        const r = row.getElementsByTagName("input")[0].value.trim();
        if (r === roll) count++;
    });

    return count > 1;
}

/* ------------------ ADD STUDENT ------------------ */
function addStudent() {
    const tbody = document.getElementById("attendanceTable").getElementsByTagName("tbody")[0];
    const lastRow = tbody.lastElementChild;
    const inputs = lastRow.getElementsByTagName("input");

    if (!isRowFilled(lastRow)) {
        showError("Please fill Roll No, Name, Present Days & Total Days before adding another student!");
        return;
    }

    const newRoll = inputs[0].value.trim();
    if (isDuplicateRoll(newRoll)) {
        showError("This Roll Number already exists!");
        return;
    }

    const row = document.createElement("tr");

    row.innerHTML = `
        <td><input type="number" placeholder="Roll No."></td>
        <td><input type="text" placeholder="Student Name"></td>

        <td><input type="checkbox"></td>
        <td><input type="checkbox"></td>
        <td><input type="checkbox"></td>
        <td><input type="checkbox"></td>
        <td><input type="checkbox"></td>
        <td><input type="checkbox"></td>

        <td><input type="number" placeholder="Present"></td>
        <td><input type="number" placeholder="Total"></td>

        <td><button class="deleteBtn" onclick="deleteRow(this)">Delete</button></td>
    `;

    tbody.appendChild(row);
}

/* ------------------ DELETE ROW ------------------ */
function deleteRow(button) {
    const inputRow = button.closest("tr");
    const rollToDelete = inputRow.getElementsByTagName("input")[0].value.trim();

    inputRow.remove();

    const resultBody = document.getElementById("resultBody");
    const resultRows = Array.from(resultBody.getElementsByTagName("tr"));

    resultRows.forEach(r => {
        if (r.children[1].innerText.trim() === rollToDelete) {
            r.remove();
        }
    });

    const refreshed = Array.from(resultBody.getElementsByTagName("tr"));
    refreshed.forEach((r, i) => r.children[0].innerText = i + 1);

    if (refreshed.length === 0) {
        document.getElementById("resultTable").classList.add("hidden");
    }
}

/* ------------------ MAIN CALCULATION ------------------ */
function calculateAttendance() {
    const tbody = document.getElementById("attendanceTable").getElementsByTagName("tbody")[0];
    const rows = Array.from(tbody.getElementsByTagName("tr"));
    const resultBody = document.getElementById("resultBody");

    let tempSeen = new Set();

    // Validation first
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].getElementsByTagName("input");

        if (!isRowFilled(rows[i])) {
            showError("All fields must be filled before calculating!");
            return;
        }

        const roll = inputs[0].value.trim();
        if (tempSeen.has(roll)) {
            showError("Duplicate Roll Number: " + roll);
            return;
        }

        tempSeen.add(roll);
    }

    // Safe to clear old output
    resultBody.innerHTML = "";
    document.getElementById("resultTable").classList.add("hidden");

    let data = [];
    let seenRolls = new Set();

    // Actual calculation
    for (let i = 0; i < rows.length; i++) {
        const inputs = rows[i].getElementsByTagName("input");
        const roll = inputs[0].value.trim();

        if (seenRolls.has(roll)) {
            showError("Duplicate Roll Number: " + roll);
            continue;
        }

        seenRolls.add(roll);

        let name = inputs[1].value.trim();
        let present = parseInt(inputs[8].value);
        let total = parseInt(inputs[9].value);

        // Count weekly present
        let weeklyPresent = 0;
        for (let j = 2; j <= 7; j++) {
            if (inputs[j].checked) weeklyPresent++;
        }

        let weeklyPercent = ((weeklyPresent / 6) * 100).toFixed(2);
        let overallPercent = ((present / total) * 100).toFixed(2);

        data.push({
            roll: parseInt(roll),
            name,
            weeklyPresent,
            weeklyPercent,
            present,
            total,
            overallPercent
        });
    }

    // Sort & Display
    data.sort((a, b) => a.roll - b.roll);

    data.forEach((s, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${s.roll}</td>
            <td>${s.name}</td>
            <td>${s.weeklyPresent}</td>
            <td>${s.weeklyPercent}%</td>
            <td>${s.present}</td>
            <td>${s.total}</td>
            <td>${s.overallPercent}%</td>
        `;

        resultBody.appendChild(row);
    });

    document.getElementById("resultTable").classList.remove("hidden");
}

/* ------------------ PRINT RESULT ------------------ */
function printResult() {
    const table = document.getElementById("resultTable");

    if (table.classList.contains("hidden")) {
        showError("No result available to print!");
        return;
    }

    const win = window.open("", "", "height=600,width=800");
    win.document.write("<html><head><title>Print Attendance Result</title>");

    win.document.write(`
        <style>
            table, th, td {
                border: 1px solid #000;
                border-collapse: collapse;
                padding: 8px;
                text-align: center;
            }
            h2 { text-align: center; }
        </style>
    `);

    win.document.write("</head><body>");
    win.document.write("<h2>Attendance Result</h2>");
    win.document.write(table.outerHTML);
    win.document.write("</body></html>");

    win.document.close();
    win.print();
}

/* ------------------ DOWNLOAD PDF ------------------ */
async function downloadPDF() {
    const table = document.getElementById("resultTable");

    if (table.classList.contains("hidden")) {
        showError("No result available to download!");
        return;
    }

    const canvas = await html2canvas(table);
    const img = canvas.toDataURL("image/png");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.setFontSize(18);
    pdf.text("Attendance Result", w / 2, 15, { align: "center" });

    pdf.addImage(img, "PNG", 5, 25, w - 10, h);

    pdf.save("Attendance_Result.pdf");
}
