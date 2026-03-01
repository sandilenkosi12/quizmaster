// Quiz Application
class QuizApp {
    constructor() {
        // API Configuration
        this.API_URL = 'https://opentdb.com/api.php';
        
        // Game State
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timeBonus = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.selectedOption = null;
        this.isAnswered = false;
        
        // DOM Elements
        this.screens = {
            start: document.getElementById('startScreen'),
            quiz: document.getElementById('quizScreen'),
            results: document.getElementById('resultsScreen')
        };
        
        // Form elements
        this.categorySelect = document.getElementById('categorySelect');
        this.difficultySelect = document.getElementById('difficultySelect');
        this.amountSelect = document.getElementById('amountSelect');
        this.timeSelect = document.getElementById('timeSelect');
        this.startBtn = document.getElementById('startBtn');
        
        // Quiz elements
        this.questionText = document.getElementById('questionText');
        this.categoryBadge = document.getElementById('categoryBadge');
        this.optionsContainer = document.getElementById('optionsContainer');
        this.questionCounter = document.getElementById('questionCounter');
        this.scoreDisplay = document.getElementById('scoreDisplay');
        this.timerDisplay = document.getElementById('timerDisplay');
        this.progressBar = document.getElementById('progressBar');
        
        // Results elements
        this.finalScore = document.getElementById('finalScore');
        this.correctCount = document.getElementById('correctCount');
        this.incorrectCount = document.getElementById('incorrectCount');
        this.timeBonusEl = document.getElementById('timeBonus');
        this.accuracy = document.getElementById('accuracy');
        this.highScoreMessage = document.getElementById('highScoreMessage');
        this.playAgainBtn = document.getElementById('playAgainBtn');
        this.shareBtn = document.getElementById('shareBtn');
        
        // High score
        this.highScore = localStorage.getItem('quizHighScore') || 0;
        document.getElementById('highScore').textContent = this.highScore;
        
        this.initEventListeners();
    }

    initEventListeners() {
        this.startBtn.addEventListener('click', () => this.startQuiz());
        this.playAgainBtn.addEventListener('click', () => this.showStartScreen());
        this.shareBtn.addEventListener('click', () => this.shareResults());
    }

    async startQuiz() {
        const category = this.categorySelect.value;
        const difficulty = this.difficultySelect.value;
        const amount = this.amountSelect.value;
        this.timeLeft = parseInt(this.timeSelect.value);
        
        this.showLoading();
        
        try {
            const response = await fetch(
                `${this.API_URL}?amount=${amount}&category=${category}&difficulty=${difficulty}&type=multiple`
            );
            const data = await response.json();
            
            if (data.response_code === 0) {
                this.questions = this.formatQuestions(data.results);
                this.currentQuestionIndex = 0;
                this.score = 0;
                this.timeBonus = 0;
                this.updateScore();
                this.showQuizScreen();
                this.loadQuestion();
            } else {
                alert('Failed to load questions. Using backup questions.');
                this.loadBackupQuestions();
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Error loading questions. Using backup questions.');
            this.loadBackupQuestions();
        }
    }

    formatQuestions(questions) {
        return questions.map(q => ({
            question: this.decodeHtml(q.question),
            correctAnswer: this.decodeHtml(q.correct_answer),
            options: this.shuffleArray([
                ...q.incorrect_answers.map(a => this.decodeHtml(a)),
                this.decodeHtml(q.correct_answer)
            ]),
            category: q.category,
            difficulty: q.difficulty
        }));
    }

    loadBackupQuestions() {
        // Backup questions in case API fails
        this.questions = [
            {
                question: "What is the capital of South Africa?",
                correctAnswer: "Pretoria",
                options: ["Cape Town", "Johannesburg", "Pretoria", "Durban"],
                category: "Geography",
                difficulty: "easy"
            },
            {
                question: "Which planet is known as the Red Planet?",
                correctAnswer: "Mars",
                options: ["Venus", "Mars", "Jupiter", "Saturn"],
                category: "Science",
                difficulty: "easy"
            },
            {
                question: "Who painted the Mona Lisa?",
                correctAnswer: "Leonardo da Vinci",
                options: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michelangelo"],
                category: "Art",
                difficulty: "medium"
            },
            {
                question: "What year did South Africa host the FIFA World Cup?",
                correctAnswer: "2010",
                options: ["2006", "2010", "2014", "2018"],
                category: "Sports",
                difficulty: "medium"
            },
            {
                question: "Which element has the chemical symbol 'O'?",
                correctAnswer: "Oxygen",
                options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
                category: "Science",
                difficulty: "easy"
            }
        ];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.timeBonus = 0;
        this.updateScore();
        this.showQuizScreen();
        this.loadQuestion();
    }

    showLoading() {
        // You could add a loading spinner here
    }

    showStartScreen() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.start.classList.add('active');
    }

    showQuizScreen() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.quiz.classList.add('active');
    }

    showResultsScreen() {
        Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
        this.screens.results.classList.add('active');
        this.displayResults();
    }

    loadQuestion() {
        if (this.currentQuestionIndex >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        
        // Update UI
        this.questionText.textContent = question.question;
        this.categoryBadge.textContent = `${question.category} • ${question.difficulty}`;
        this.questionCounter.textContent = `${this.currentQuestionIndex + 1}/${this.questions.length}`;
        
        // Update progress bar
        const progress = ((this.currentQuestionIndex) / this.questions.length) * 100;
        this.progressBar.style.width = `${progress}%`;
        
        // Create option buttons
        this.optionsContainer.innerHTML = '';
        question.options.forEach((option, index) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => this.selectOption(option));
            this.optionsContainer.appendChild(btn);
        });
        
        // Reset state
        this.isAnswered = false;
        this.selectedOption = null;
        this.timeLeft = parseInt(this.timeSelect.value);
        this.timerDisplay.textContent = `${this.timeLeft}s`;
        
        // Start timer
        this.startTimer();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);
        
        this.timer = setInterval(() => {
            if (this.isAnswered) return;
            
            this.timeLeft--;
            this.timerDisplay.textContent = `${this.timeLeft}s`;
            
            if (this.timeLeft <= 5) {
                this.timerDisplay.style.color = 'var(--danger)';
            }
            
            if (this.timeLeft <= 0) {
                this.timeOut();
            }
        }, 1000);
    }

    timeOut() {
        clearInterval(this.timer);
        this.isAnswered = true;
        this.timeBonus += 0;
        
        // Show correct answer
        const question = this.questions[this.currentQuestionIndex];
        const buttons = document.querySelectorAll('.option-btn');
        
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === question.correctAnswer) {
                btn.classList.add('correct');
            }
        });
        
        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }, 1500);
    }

    selectOption(option) {
        if (this.isAnswered) return;
        
        this.isAnswered = true;
        clearInterval(this.timer);
        
        const question = this.questions[this.currentQuestionIndex];
        const buttons = document.querySelectorAll('.option-btn');
        const isCorrect = option === question.correctAnswer;
        
        // Calculate time bonus (points per second left)
        const timeBonusPoints = this.timeLeft * 10;
        
        // Highlight selected answer
        buttons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === question.correctAnswer) {
                btn.classList.add('correct');
            }
            if (btn.textContent === option && !isCorrect) {
                btn.classList.add('incorrect');
            }
            if (btn.textContent === option) {
                btn.classList.add('selected');
            }
        });
        
        // Update score
        if (isCorrect) {
            this.score += 100;
            this.timeBonus += timeBonusPoints;
        }
        
        this.updateScore();
        
        // Move to next question after delay
        setTimeout(() => {
            this.currentQuestionIndex++;
            this.loadQuestion();
        }, 1500);
    }

    updateScore() {
        this.scoreDisplay.textContent = this.score + this.timeBonus;
    }

    endQuiz() {
        clearInterval(this.timer);
        this.showResultsScreen();
    }

    displayResults() {
        const totalQuestions = this.questions.length;
        const correct = Math.floor(this.score / 100); // Assuming 100 points per correct answer
        const incorrect = totalQuestions - correct;
        const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
        
        this.finalScore.textContent = this.score + this.timeBonus;
        this.correctCount.textContent = correct;
        this.incorrectCount.textContent = incorrect;
        this.timeBonusEl.textContent = this.timeBonus;
        this.accuracy.textContent = `${accuracy}%`;
        
        // Check for high score
        const totalScore = this.score + this.timeBonus;
        if (totalScore > this.highScore) {
            this.highScore = totalScore;
            localStorage.setItem('quizHighScore', this.highScore);
            document.getElementById('highScore').textContent = this.highScore;
            this.highScoreMessage.style.display = 'block';
        } else {
            this.highScoreMessage.style.display = 'none';
        }
    }

    shareResults() {
        const text = `I scored ${this.score + this.timeBonus} points on QuizMaster! Can you beat my score?`;
        if (navigator.share) {
            navigator.share({
                title: 'QuizMaster Results',
                text: text,
                url: window.location.href
            });
        } else {
            alert('Share feature not supported. Copy your score manually!');
        }
    }

    // Utility Functions
    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});