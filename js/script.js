let cardContainer = document.querySelector(".cardContainer");
let SongContainer = document.querySelector(".songs-container");

(async function main() {
  function positionBottomBar() {
    const playlist = document.querySelector(".SpotifyPlaylist");
    const bar = document.querySelector(".controler");
    if (!playlist || !bar) return;
    const percent = 98;
    const rect = playlist.getBoundingClientRect();
    bar.style.width = rect.width * (percent / 100) + "px";
    bar.style.left = rect.left + rect.width * ((100 - percent) / 200) + "px";
  }

  window.addEventListener("resize", positionBottomBar);
  window.addEventListener("load", positionBottomBar);

  const toggleBtn = document.getElementById("toggleBtn");
  const closeBtn = document.getElementById("closeBtn");
  const left = document.querySelector(".left");

  toggleBtn.addEventListener("click", () => {
    left.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    left.classList.remove("active");
  });

  let currentSong = null;
  let currentIndex = -1;
  let songList = [];

  async function Add_Album_Cards(folder) {
    let currFolder = await fetch(`/${folder}/`);
    let text = await currFolder.text();
    let div = document.createElement("div");
    div.innerHTML = text;

    let songs = [];
    Array.from(div.getElementsByTagName("a")).forEach((a) => {
      let path = new URL(a.href).pathname;
      if (path.includes(`${folder}`) && !path.includes(`.htaccess`))
        songs.push(path);
    });

    songs.forEach(async (songPath) => {
      let cardName = songPath.replace(`/${folder}/`, "").replace("/", "").replace(`%20`, " ");
      let info_json = await (await fetch(songPath + "info.json")).json();

      cardContainer.innerHTML += `
        <div class="card cursor" data-folder="${songPath}">
          <img src="${songPath + "cover.jpg"}" alt="">
          <div class="text">
            <p class="P_name">${info_json.title}</p>
            <p class="P_description">${info_json.description}</p>
          </div>
        </div>`;
    });
  }

  await Add_Album_Cards("songs");

  async function waitAndPreloadFirstCard() {
    const firstCard = document.querySelector(".card");
    if (!firstCard) return setTimeout(waitAndPreloadFirstCard, 100);
  
    const folderPath = firstCard.getAttribute("data-folder");
    songList = await Add_Song_List(folderPath);
  
    if (songList.length > 0) {
      currentIndex = 0;
      currentSong = new Audio(songList[0]);
      currentSong.volume = volumeSlider.value / 100;
  
      const title = decodeURIComponent(songList[0].split("/").pop());
      document.querySelector(".upper span").innerHTML = title;
  
      currentSong.addEventListener("loadedmetadata", () => {
        TimeSlider.max = currentSong.duration || 100;
        TimeSlider.value = 0;
        const current = formatTime(0);
        const total = formatTime(currentSong.duration);
        document.querySelector(".time span").innerHTML = `${current} / ${total}`;
      });
  
      currentSong.play().then(() => {
        currentSong.pause();
        PLAY_PAUSE.src = "img/play.svg";
      });
    }
  }
  
  waitAndPreloadFirstCard();
  cardContainer.addEventListener("click", async (e) => {
    const clickedCard = e.target.closest(".card");
    if (clickedCard) {
      const folderPath = clickedCard.getAttribute("data-folder");
      songList = await Add_Song_List(folderPath);
      playSongAt(0);
    }
  });

  SongContainer.addEventListener("click", (e) => {
    const clickedSong = e.target.closest(".song_list");
    if (clickedSong) {
      const folderPath = clickedSong.getAttribute("data-folder");
      const title = clickedSong.querySelector(".song_name")?.textContent.trim();
      if (currentSong) {
        currentSong.pause();
        currentSong.currentTime = 0;
      }
      currentIndex = songList.indexOf(folderPath);
      currentSong = new Audio(folderPath);
      currentSong.volume = volumeSlider.value / 100;
      currentSong.play();
      PLAY_PAUSE.src = "img/pause.svg";
      TimeSlider.value = 0;
      document.querySelector(".upper span").innerHTML = title;

      currentSong.addEventListener("timeupdate", () => {
        TimeSlider.max = currentSong.duration || 100;
        TimeSlider.value = currentSong.currentTime;
        const current = formatTime(currentSong.currentTime);
        const total = formatTime(currentSong.duration);
        document.querySelector(".time span").innerHTML = `${current} / ${total}`;
      });
    }
  });

  let volume_range = 0.1;
  let isMuted = false;

  const volumeSlider = document.querySelector(".volume_range");
  const volumeIcon = document.querySelector(".volume img");

  volumeSlider.value = volume_range * 100;

  volumeSlider.addEventListener("input", () => {
    volume_range = volumeSlider.value / 100;
    if (currentSong) {
      currentSong.volume = volume_range;
    }

    if (volume_range == 0) {
      isMuted = true;
      volumeIcon.src = "img/mute.svg";
    } else {
      isMuted = false;
      volumeIcon.src = "img/volume.svg";
    }
  });

  volumeIcon.addEventListener("click", () => {
    isMuted = !isMuted;
    if (isMuted) {
      if (currentSong) currentSong.volume = 0;
      volumeIcon.src = "img/mute.svg";
      volumeSlider.value = 0;
    } else {
      if (currentSong) currentSong.volume = volume_range;
      volumeIcon.src = "img/volume.svg";
      volumeSlider.value = 100 * volume_range;
    }
  });

  const PLAY_PAUSE = document.querySelector(".play_pause");
  const TimeSlider = document.querySelector(".time_slider");

  PLAY_PAUSE.addEventListener("click", () => {
    if (!currentSong) return;
    if (currentSong.paused) {
      currentSong.play();
      PLAY_PAUSE.src = "img/pause.svg";
    } else {
      currentSong.pause();
      PLAY_PAUSE.src = "img/play.svg";
    }
  });

  if (currentSong) {
    currentSong.addEventListener("timeupdate", () => {
      if (!TimeSlider.getAttribute("max"))
        TimeSlider.max = currentSong.duration || 100;
      TimeSlider.value = currentSong.currentTime;
    });
  }

  TimeSlider.addEventListener("input", () => {
    if (currentSong) {
      currentSong.currentTime = TimeSlider.value;
    }
  });

  const PRE = document.querySelector(".prev");
  const NEXT = document.querySelector(".next");

  NEXT.addEventListener("click", () => {
    if (currentIndex < songList.length - 1) {
      playSongAt(currentIndex + 1);
    }
  });

  PRE.addEventListener("click", () => {
    if (currentIndex > 0) {
      playSongAt(currentIndex - 1);
    }
  });

  function playSongAt(index) {
    const folderPath = songList[index];
    if (!folderPath) return;
    if (currentSong) {
      currentSong.pause();
      currentSong.currentTime = 0;
    }

    currentIndex = index;
    currentSong = new Audio(folderPath);
    currentSong.volume = volumeSlider.value / 100;

    const title = decodeURIComponent(folderPath.split("/").pop());
    document.querySelector(".upper span").innerHTML = title;

    currentSong.addEventListener("loadedmetadata", () => {
      TimeSlider.max = currentSong.duration;
      const current = formatTime(0);
      const total = formatTime(currentSong.duration);
      document.querySelector(".time span").innerHTML = `${current} / ${total}`;
    });

    currentSong.addEventListener("timeupdate", () => {
      TimeSlider.value = currentSong.currentTime;
      const current = formatTime(currentSong.currentTime);
      const total = formatTime(currentSong.duration);
      document.querySelector(".time span").innerHTML = `${current} / ${total}`;
    });

    currentSong.play();
    PLAY_PAUSE.src = "img/pause.svg";
    TimeSlider.value = 0;
  }
})();

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function Add_Song_List(folder) {
  let currFolder = await fetch(`${folder}`);
  let text = await currFolder.text();
  let div = document.createElement("div");
  div.innerHTML = text;

  let songs = [];

  Array.from(div.getElementsByTagName("a")).forEach((a) => {
    let path = new URL(a.href).pathname;
    if (path.includes(`${folder}`) && !path.includes(`.htaccess`))
      songs.push(path);
  });

  SongContainer.innerHTML = "";

  songs.forEach((SongPath) => {
    if (!SongPath.endsWith(".mp3")) return;
    let SongName = SongPath.replace(`${folder}`, "")
      .replaceAll("/", "")
      .replaceAll(`%20`, " ");
    SongContainer.innerHTML += `
      <li class="song_list cursor" data-folder="${folder + SongName}">
        <img class="invert" src="img/music.svg" alt="">
        <div class="list_name">
          <p class="song_name">${SongName}</p>
          <p class="author_name">Author Name</p>
        </div>
        <div class="play_now">
          <span>Play Now</span>
          <img class="invert" src="img/play.svg" alt="">
        </div>
      </li>`;
  });

  let OnlySongPath = [];
  songs.forEach((path) => {
    if (path.endsWith(".mp3")) {
      OnlySongPath.push(path);
    }
  });

  return OnlySongPath;
}
