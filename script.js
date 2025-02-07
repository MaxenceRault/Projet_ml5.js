let video, facemesh, predictions = [];

// Questions + quiz
let questions = [
  { question: "Le soleil est une étoile ?", answer: true },
  { question: "2 + 2 = 5 ?", answer: false },
  { question: "Paris est la capitale de la France ?", answer: true },
  { question: "L'eau bout à 50°C ?", answer: false },
  { question: "Un chien est un mammifère ?", answer: true },
];
let currentQuestionIndex = 0;
let score = 0;
let quizActive = true;

// Zones + timers
let currentZone = "aucune"; // "Vrai", "Faux" ou "aucune"
let timeInZone = 0;
let lastFrameTime = 0;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Configuration FaceMesh
  let options = {
    maxFaces: 1,
    refineLandmarks: false,
    // flipHorizontal: true // activez si besoin
  };
  facemesh = ml5.facemesh(video, options, modelReady);
  facemesh.on("predict", res => predictions = res);

  lastFrameTime = millis();
  showQuestion();
}

function modelReady() {
  console.log("FaceMesh prêt !");
}

function draw() {
  image(video, 0, 0, width, height);

  // Ligne centrale
  stroke(255, 0, 0);
  strokeWeight(2);
  line(width / 2, 0, width / 2, height);

  let now = millis();
  let dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;

  if (!quizActive) return;

  if (predictions.length > 0) {
    let keypoints = predictions[0].scaledMesh;
    if (!keypoints) return;

    let leftEar = keypoints[234];
    let rightEar = keypoints[454];
    if (leftEar && rightEar) {
      let midEarX = (leftEar[0] + rightEar[0]) / 2;
      let headPosition = midEarX - width / 2;
      document.getElementById("position").innerText = headPosition.toFixed(2);

      let newZone = "aucune";
      if (headPosition < -30) {
        newZone = "Vrai";
      } else if (headPosition > 30) {
        newZone = "Faux";
      }

      if (newZone !== currentZone) {
        currentZone = newZone;
        timeInZone = 0;
      } else {
        timeInZone += dt;
      }

      document.getElementById("currentZone").innerText = currentZone;
      document.getElementById("timer").innerText = timeInZone.toFixed(1);

      if ((currentZone === "Vrai" || currentZone === "Faux") && timeInZone >= 2) {
        validateAnswer(currentZone);
      }

      fill(0, 255, 0);
      noStroke();
      for (let i = 0; i < keypoints.length; i++) {
        let [x, y] = keypoints[i];
        circle(x, y, 3);
      }
    }
  }
}

function validateAnswer(zone) {
  let correct = questions[currentQuestionIndex].answer;
  if ((zone === "Vrai" && correct) || (zone === "Faux" && !correct)) {
    score++;
  }
  currentQuestionIndex++;
  timeInZone = 0;
  currentZone = "aucune";
  document.getElementById("currentZone").innerText = currentZone;
  document.getElementById("timer").innerText = timeInZone.toFixed(1);
  showQuestion();
}

function showQuestion() {
  if (currentQuestionIndex < questions.length) {
    document.getElementById("question").innerText =
      "Q" + (currentQuestionIndex+1) + ": " + questions[currentQuestionIndex].question;
  } else {
    quizActive = false;
    document.getElementById("question").innerText = "Quiz terminé !";
    document.getElementById("score").innerText =
      "Ton score : " + score + " / " + questions.length;
  }
}
