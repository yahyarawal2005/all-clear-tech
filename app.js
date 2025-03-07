// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCutyrVdAXgzDoGglHGD-j55AVzFjHR5eo",
    authDomain: "allcleartech-11c44.firebaseapp.com",
    projectId: "allcleartech-11c44",
    storageBucket: "allcleartech-11c44.firebasestorage.app",
    messagingSenderId: "746758569433",
    appId: "1:746758569433:web:64a5db5c3123a758422dc8"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const authSection = document.getElementById('authSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const teacherNameElement = document.getElementById('teacherName');
const quiz = document.getElementById('quiz');
// Register Student Elements
const registerStudentBtn = document.getElementById('registerStudentBtn');
const registerStudentSection = document.getElementById('registerStudentSection');
const studentForm = document.getElementById('studentForm');
const cancelRegisterBtn = document.getElementById('cancelRegisterBtn');

// View Students Elements
const viewStudentsBtn = document.getElementById('viewStudentsBtn');
const viewStudentsSection = document.getElementById('viewStudentsSection');
const studentTableBody = document.getElementById('studentTableBody');

// Update Records Elements
const updateRecordsBtn = document.getElementById('updateRecordsBtn');
const updateRecordsSection = document.getElementById('updateRecordsSection');
const studentSelect = document.getElementById('studentSelect');
const updateForm = document.getElementById('updateForm');
const cancelUpdateBtn = document.getElementById('cancelUpdateBtn');
const saveUpdateBtn = document.getElementById('saveUpdateBtn');
const mlPrediction = document.getElementById('mlPrediction');

// Dashboard Stats Elements
const totalStudentsElement = document.getElementById('totalStudents');
const avgAttendanceElement = document.getElementById('avgAttendance');
const avgMarksElement = document.getElementById('avgMarks');
const atRiskStudentsElement = document.getElementById('atRiskStudents');

// Authentication
loginButton.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Fetch teacher details from Firestore
        const teacherDoc = await db.collection('teachers').doc(user.uid).get();
        const teacherData = teacherDoc.data();
        
        teacherNameElement.textContent = `Welcome, ${teacherData.name}`;
        
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        
        // Load dashboard stats
        loadDashboardStats(user.uid);
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
});

logoutButton.addEventListener('click', () => {
    auth.signOut();
    authSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
});

// Register Student
registerStudentBtn.addEventListener('click', () => {
    registerStudentSection.classList.remove('hidden');
    viewStudentsSection.classList.add('hidden');
    updateRecordsSection.classList.add('hidden');
});

cancelRegisterBtn.addEventListener('click', () => {
    registerStudentSection.classList.add('hidden');
    studentForm.reset();
});

studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    
    const studentData = {
        rollNumber: document.getElementById('rollNumber').value,
        studentName: document.getElementById('studentName').value,
        studentEmail: document.getElementById('studentEmail').value,
        studentMobile: document.getElementById('studentMobile').value,
        parentEmail: document.getElementById('parentEmail').value,
        parentMobile: document.getElementById('parentMobile').value,
        address: document.getElementById('address').value,
        teacherId: user.uid,
        attendance: 0,
        marks: 0,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        await db.collection('students').add(studentData);
        alert('Student registered successfully!');
        studentForm.reset();
        registerStudentSection.classList.add('hidden');
        
        // Reload dashboard stats
        loadDashboardStats(user.uid);
    } catch (error) {
        alert('Error registering student: ' + error.message);
    }
});

// View Students
viewStudentsBtn.addEventListener('click', () => {
    registerStudentSection.classList.add('hidden');
    updateRecordsSection.classList.add('hidden');
    viewStudentsSection.classList.remove('hidden');
    
    const user = auth.currentUser;
    loadStudentsList(user.uid);
});

async function loadStudentsList(teacherId) {
    try {
        const studentsSnapshot = await db.collection('students')
            .where('teacherId', '==', teacherId)
            .get();
        
        studentTableBody.innerHTML = '';
        
        if (studentsSnapshot.empty) {
            studentTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-4 text-gray-500">
                        No students found. Please register students.
                    </td>
                </tr>
            `;
            return;
        }
        
        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="py-3 px-4">${student.rollNumber}</td>
                <td class="py-3 px-4">${student.studentName}</td>
                <td class="py-3 px-4">${student.studentEmail || 'N/A'}</td>
                <td class="py-3 px-4">${student.studentMobile || 'N/A'}</td>
                <td class="py-3 px-4">${student.parentEmail}</td>
                <td class="py-3 px-4">${student.attendance || 0}%</td>
                <td class="py-3 px-4">${student.marks || 0}</td>
                <td class="py-3 px-4">
                    <button class="text-blue-600 hover:text-blue-800 edit-student" data-id="${doc.id}">Edit</button>
                </tr>
            `;
            studentTableBody.appendChild(row);
        });

        // Add event listeners for edit buttons
        studentTableBody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('edit-student')) {
                const studentId = e.target.getAttribute('data-id');
                await editStudent(studentId);
            }
        });
    } catch (error) {
        console.error('Error loading students:', error);
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-red-500">
                    Failed to load students. ${error.message}
                </td>
            </tr>
        `;
    }
}

// Add this function to handle editing a student
async function editStudent(studentId) {
    try {
        // Navigate to update records section
        registerStudentSection.classList.add('hidden');
        viewStudentsSection.classList.add('hidden');
        updateRecordsSection.classList.remove('hidden');
        
        // Populate student dropdown
        const user = auth.currentUser;
        await loadStudentDropdown(user.uid);
        
        // Set the selected student
        studentSelect.value = studentId;
        
        // Trigger change event to load student details
        const event = new Event('change');
        studentSelect.dispatchEvent(event);
    } catch (error) {
        console.error('Error editing student:', error);
        alert('Failed to load student details: ' + error.message);
    }
}

// Update Records
updateRecordsBtn.addEventListener('click', () => {
    registerStudentSection.classList.add('hidden');
    viewStudentsSection.classList.add('hidden');
    updateRecordsSection.classList.remove('hidden');
    
    const user = auth.currentUser;
    loadStudentDropdown(user.uid);
});

async function loadStudentDropdown(teacherId) {
    try {
        const studentsSnapshot = await db.collection('students')
            .where('teacherId', '==', teacherId)
            .get();
        
        studentSelect.innerHTML = '<option value="">-- Select a student --</option>';
        
        studentsSnapshot.forEach(doc => {
            const student = doc.data();
            const option = `
                <option value="${doc.id}">
                    ${student.rollNumber} - ${student.studentName}
                </option>
            `;
            studentSelect.innerHTML += option;
        });
    } catch (error) {
        alert('Error loading students: ' + error.message);
    }
}

studentSelect.addEventListener('change', async (e) => {
    const studentId = e.target.value;
    if (studentId) {
        try {
            const studentDoc = await db.collection('students').doc(studentId).get();
            const studentData = studentDoc.data();
            
            document.getElementById('updateAttendance').value = studentData.attendance || 0;
            document.getElementById('updateMarks').value = studentData.marks || 0;
            document.getElementById('updateStatus').value = studentData.status || 'active';
            
            updateForm.classList.remove('hidden');
            
            // Predict dropout risk using ML model
            predictDropoutRisk(studentData);
        } catch (error) {
            alert('Error fetching student details: ' + error.message);
        }
    } else {
        updateForm.classList.add('hidden');
        if (mlPrediction) {
            mlPrediction.innerHTML = '';
        }
    }
});

// Predict dropout risk using model.pkl
function predictDropoutRisk(student) {
    // Make sure mlPrediction element exists
    if (!mlPrediction) return;
    
    // Clear previous prediction
    mlPrediction.innerHTML = '<div class="p-4 text-gray-500">Calculating risk prediction...</div>';
    
    // Prepare data for prediction
    const predictionData = {
        attendance: student.attendance || 0,
        totalDays: student.totalDays || 0,
        marks: student.marks || 0,
        previousPerformance: student.previousPerformance || 0,
        studentId: student.id
    };
    
    // Send data to server for prediction using model.pkl
    fetch('/api/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Format and display prediction
            const riskPercentage = data.riskPercentage;
            const riskFactors = data.riskFactors || [];
            
            let riskClass = '';
            let riskText = '';
            
            if (riskPercentage > 75) {
                riskClass = 'bg-red-100 border-red-500 text-red-700';
                riskText = 'High Risk of Dropout';
            } else if (riskPercentage > 50) {
                riskClass = 'bg-yellow-100 border-yellow-500 text-yellow-700';
                riskText = 'Moderate Risk of Dropout';
            } else {
                riskClass = 'bg-green-100 border-green-500 text-green-700';
                riskText = 'Low Risk of Dropout';
            }
            
            mlPrediction.innerHTML = `
                <div class="${riskClass} border-l-4 p-4 rounded-md mt-4">
                    <h3 class="font-medium">${riskText} (${riskPercentage}%)</h3>
                    <p class="mt-2">Factors contributing to this prediction:</p>
                    <ul class="list-disc pl-5 mt-2">
                        ${riskFactors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            mlPrediction.innerHTML = `
                <div class="bg-gray-100 border-l-4 border-gray-500 text-gray-700 p-4 rounded-md mt-4">
                    <p>Unable to predict dropout risk.</p>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('Error predicting dropout risk:', error);
        mlPrediction.innerHTML = `
            <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mt-4">
                <p>Error predicting dropout risk. Please try again.</p>
            </div>
        `;
    });
}

// Add this function to send SMS using Twilio
async function sendSms(to, message) {
    try {
        const response = await fetch('/api/send-sms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to, message })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`SMS sent successfully to ${to}`);
        } else {
            console.error(`Failed to send SMS to ${to}:`, result.error);
        }
    } catch (error) {
        console.error('Error sending SMS:', error);
    }
}

// Modify the saveUpdateBtn event listener to trigger SMS if a student is at risk
saveUpdateBtn.addEventListener('click', async () => {
    const studentId = studentSelect.value;
    const attendance = parseInt(document.getElementById('updateAttendance').value);
    const marks = parseInt(document.getElementById('updateMarks').value);
    const status = document.getElementById('updateStatus').value;

    try {
        // Determine if the student is "at-risk" or "active"
        let newStatus = (attendance < 60 || marks < 50) ? 'at-risk' : 'active';

        // Update student record in Firebase
        await db.collection('students').doc(studentId).update({
            attendance,
            marks,
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Fetch student data for SMS
        const studentDoc = await db.collection('students').doc(studentId).get();
        const studentData = studentDoc.data();

        // Construct the SMS message
        const message = `Update: ${studentData.studentName}'s status: ${newStatus.toUpperCase()}.\nAttendance: ${attendance}%, Marks: ${marks}.\nContact school for details.`;

        // Send SMS to student and parent (if numbers exist)
        if (studentData.studentMobile) {
            sendSms(studentData.studentMobile, message);
        }
        if (studentData.parentMobile) {
            sendSms(studentData.parentMobile, message);
        }

        alert('Student record updated and SMS sent successfully!');

        // Reload dashboard stats
        const user = auth.currentUser;
        loadDashboardStats(user.uid);
    } catch (error) {
        alert('Error updating student record: ' + error.message);
    }
});

// Helper function to send SMS (Replace with your Twilio integration)
function sendSms(phoneNumber, message) {
    console.log(`Sending SMS to ${phoneNumber}: ${message}`);
    // Integrate with Twilio here (or other SMS services)
}

cancelUpdateBtn.addEventListener('click', () => {
    updateForm.classList.add('hidden');
    studentSelect.value = '';
    if (mlPrediction) {
        mlPrediction.innerHTML = '';
    }
});

// Dashboard Stats
async function loadDashboardStats(teacherId) {
    try {
        const studentsSnapshot = await db.collection('students')
            .where('teacherId', '==', teacherId)
            .get();
        
        const students = studentsSnapshot.docs.map(doc => doc.data());
        
        // Total Students
        const totalStudents = students.length;
        totalStudentsElement.textContent = totalStudents;
        
        // Average Attendance
        const totalAttendance = students.reduce((sum, student) => sum + (student.attendance || 0), 0);
        const avgAttendance = totalStudents > 0 ? (totalAttendance / totalStudents).toFixed(1) : 0;
        avgAttendanceElement.textContent = `${avgAttendance}%`;
        
        // Average Marks
        const totalMarks = students.reduce((sum, student) => sum + (student.marks || 0), 0);
        const avgMarks = totalStudents > 0 ? (totalMarks / totalStudents).toFixed(1) : 0;
        avgMarksElement.textContent = avgMarks;
        
        // At Risk Students
        const atRiskStudents = students.filter(student => student.status === 'at-risk').length;
        atRiskStudentsElement.textContent = atRiskStudents;
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}

// Firebase Auth State Observer
auth.onAuthStateChanged((user) => {
    if (user) {
        authSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        
        // Load teacher name and dashboard stats
        db.collection('teachers').doc(user.uid).get().then((doc) => {
            const teacherData = doc.data();
            teacherNameElement.textContent = `Welcome, ${teacherData.name}`;
        });
        
        loadDashboardStats(user.uid);
    } else {
        authSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});
// Add this function to your JavaScript file
function setupMockPredictionAPI() {
    // Create a mock endpoint that returns prediction data
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
        if (url === '/api/predict' && options.method === 'POST') {
            return new Promise((resolve) => {
                // Parse the request data
                const requestData = JSON.parse(options.body);
                
                // Calculate a risk score based on attendance and marks
                const attendance = requestData.attendance || 0;
                const marks = requestData.marks || 0;
                
                // Simple algorithm: higher attendance and marks = lower risk
                let riskPercentage = 100 - (attendance * 0.5 + marks * 0.5);
                riskPercentage = Math.max(5, Math.min(95, riskPercentage)); // Keep between 5-95%
                
                // Generate risk factors based on the values
                const riskFactors = [];
                if (attendance < 75) {
                    riskFactors.push(`Low attendance (${attendance}%)`);
                }
                if (marks < 60) {
                    riskFactors.push(`Below average academic performance (${marks}/100)`);
                }
                if (riskFactors.length === 0) {
                    riskFactors.push("No significant risk factors");
                }
                
                // Create mock response
                const mockResponse = {
                    success: true,
                    riskPercentage: Math.round(riskPercentage),
                    riskFactors: riskFactors
                };
                
                // Create a Response object
                const responseBody = JSON.stringify(mockResponse);
                const response = new Response(responseBody, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                // Resolve after a short delay to simulate network request
                setTimeout(() => resolve(response), 500);
            });
        }
        
        // For all other requests, use the original fetch
        return originalFetch.apply(window, arguments);
    };
}
quiz.addEventListener('click', () =>{
    window.location.href="quiz.html";
})


// Call this function when your app initializes
// Add this line near the bottom of your file, before the auth.onAuthStateChanged
setupMockPredictionAPI();