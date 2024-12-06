const mario = document.querySelector(".mario");
const pipe = document.querySelector(".pipe");
const gameBoard = document.querySelector(".game-board");
const clouds = document.querySelector(".clouds");
const cronometro = document.querySelector("#cronometro"); // Seleciona o cronômetro

let tempo = 0; // Variável para o tempo
let isGameOver = false;

// Função para atualizar o cronômetro
function atualizarCronometro() {
  if (!isGameOver) {
    tempo++; // Incrementa o tempo a cada segundo
    cronometro.innerText = "SCORE: " + tempo; // Atualiza o texto do cronômetro
  }
}

// Inicia a contagem do tempo (50 MILISSEGUNDOS)
const intervaloCronometro = setInterval(atualizarCronometro, 50);

// Função de pulo
const jump = () => {
  mario.classList.add("jumpMario");

  setTimeout(() => {
    mario.classList.remove("jumpMario");
  }, 500);
};

const loop = setInterval(() => {
  const pipePosition = pipe.offsetLeft;
  const cloudsPosition = clouds.offsetLeft;
  const marioPosition = +window
    .getComputedStyle(mario)
    .bottom.replace("px", "");

  if (pipePosition <= 225 && pipePosition > 0 && marioPosition < 300) {
    // Se o Mario encontrar no pipe

    // Remove animação do pipe
    pipe.style.animation = "none";
    pipe.style.left = `${pipePosition}px`;

    // Remove animação do mario
    mario.style.animation = "none";
    mario.style.bottom = `${marioPosition}px`;

    // Remove animação do cenario
    clouds.style.animation = "none";
    clouds.style.left = `${cloudsPosition}px`;

    // Troca a imagem do Mario para a game-over
    mario.src = "./Images/game-over.png";
    mario.style.width = "160px";
    mario.style.marginLeft = "80px";

    // Adiciona as letras Game Over à tela
    const gameOverImage = document.createElement("img");
    gameOverImage.src = "./Images/over.png";
    gameOverImage.classList.add("over");
    gameBoard.appendChild(gameOverImage);

    // Adiciona as letras TRY AGAIN à tela
    const tryagain = document.createElement("img");
    tryagain.src = "./Images/tryagain.png";
    tryagain.classList.add("tryagain");
    gameBoard.appendChild(tryagain);

    // Encerra o loop
    clearInterval(loop);
    clearInterval(intervaloCronometro); // Para o cronômetro quando o jogo acabar
    isGameOver = true;
  }
}, 10);

// Função para lidar com eventos de teclado e mouse
function handleInput(event) {
  if (isGameOver) {
    location.reload(); // Reinicia o jogo recarregando a página
  } else {
    jump(); // Chama a função jump
  }
}

// Adiciona event listeners para teclado e mouse
document.addEventListener("keydown", handleInput);
document.addEventListener("click", handleInput);
