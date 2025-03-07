// Firebase configuration
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

// Quiz Creation Logic
let questions = [];

function addQuestion() {
    const questionText = document.getElementById("question-text").value;
    const option1 = document.getElementById("option1").value;
    const option2 = document.getElementById("option2").value;
    const option3 = document.getElementById("option3").value;
    const option4 = document.getElementById("option4").value;
    const correctAnswer = document.getElementById("correct-answer").value;
    
    if (!questionText || !option1 || !option2 || !option3 || !option4 || !correctAnswer) {
        alert("Please fill all fields");
        return;
    }
    
    questions.push({
        question: questionText,
        options: [option1, option2, option3, option4],
        correct: parseInt(correctAnswer)
    });
    
    document.getElementById("question-text").value = "";
    document.getElementById("option1").value = "";
    document.getElementById("option2").value = "";
    document.getElementById("option3").value = "";
    document.getElementById("option4").value = "";
    document.getElementById("correct-answer").value = "";
    
    displayAddedQuestions();
}

function displayAddedQuestions() {
    let addedQuestionsDiv = document.getElementById("added-questions");
    addedQuestionsDiv.innerHTML = "";
    
    questions.forEach((q, index) => {
        let questionHtml = `<div class='added-questions'>
            <p><strong>Q${index + 1}: ${q.question}</strong></p>
        </div>`;
        addedQuestionsDiv.innerHTML += questionHtml;
    });
}

function publishQuiz() {
    if (questions.length === 0) {
        alert("Add at least one question before publishing");
        return;
    }
    
    db.collection("quizzes").add({
        questions: questions,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("Quiz published successfully!");
        questions = [];
        document.getElementById("quiz-container").innerHTML = "";
        document.getElementById("published-quiz").classList.remove("hidden");
    }).catch(error => {
        console.error("Error publishing quiz: ", error);
    });
}

function submitQuiz() {
    let score = 0;
    questions.forEach((q, index) => {
        let selected = document.querySelector(`input[name='q${index}']:checked`);
        if (selected && parseInt(selected.value) === q.correct) {
            score++;
        }
    });
    
    document.getElementById("result").innerText = `You scored ${score} out of ${questions.length}`;
}
