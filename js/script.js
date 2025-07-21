let cardContainer = document.querySelector(".cardContainer");
let SongContainer = document.querySelector(".songs-container");

//////////////////////////////////////////////////////
//            MAIN
//////////////////////////////////////////////////////
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

  ///////////////////////////////// LEFT toggle
  const toggleBtn = document.getElementById("toggleBtn");
  const closeBtn = document.getElementById("closeBtn");
  const left = document.querySelector(".left");

  toggleBtn.addEventListener("click", () => {
    left.classList.add("active");
  });

  closeBtn.addEventListener("click", () => {
    left.classList.remove("active");
  });

  /////////////////////////////////////////// Adding Album Card

  let currentSong = null;
  let currentIndex = -1;
  let songList = [];

  const albums = await (await fetch("songs/index.json")).json();

  albums.forEach((album) => {
    const folder = album.folder;
    cardContainer.innerHTML += `
      <div class="card cursor" data-folder="songs/${folder}/" data-index="${albums.indexOf(album)}" data-title="${album.title}" data-description="${album.description}">
        <img src="songs/${folder}/${album.cover}" alt="">
        <div class="text">
          <p class="P_name">${album.title}</p>
          <p class="P_description">${album.description}</p>
        </div>
      </div>`;
  });

  const PLAY_PAUSE = document.querySelector(".play_pause");
  const TimeSlider = document.querySelector(".time_slider");
  const volumeSlider = document.querySelector(".volume_range");
  const volumeIcon = document.querySelector(".volume img");
  let volume_range = 0.1;
  let isMuted = false;

  volumeSlider.value = volume_range * 100;

  /////////////////////////////////////////// Load first album and first song paused
  if (albums.length > 0) {
    const first = albums[0];
    songList = first.songs.map(f => `songs/${first.folder}/${f}`);

    SongContainer.innerHTML = "";
    first.songs.forEach((f) => {
      const songName = decodeURIComponent(f).replaceAll("%20"," ").replaceAll("/","");
      SongContainer.innerHTML += `
        <li class="song_list cursor" data-folder="songs/${first.folder}/${f}">
          <img class="invert" src="img/music.svg" alt="">
          <div class="list_name">
            <p class="song_name">${songName}</p>
            <p class="author_name">Author Name</p>
          </div>
          <div class="play_now">
            <span>Play Now</span>
            <img class="invert" src="img/play.svg" alt="">
          </div>
        </li>`;
    });

    currentIndex = 0;
    currentSong = new Audio(songList[0]);
    currentSong.volume = volumeSlider.value / 100;

    const titleText = decodeURIComponent(songList[0].split("/").pop());
    document.querySelector(".upper span").innerHTML = titleText;

    currentSong.addEventListener("loadedmetadata", () => {
      TimeSlider.max = currentSong.duration;
      document.querySelector(".time span").innerHTML = `00:00 / ${formatTime(currentSong.duration)}`;
    });

    PLAY_PAUSE.src = "img/play.svg";
  }

  ////////////////////////////////////////////////////////////////// IF CARD is Clicked
  cardContainer.addEventListener("click", async (e) => {
    const clicked = e.target.closest(".card");
    if (clicked) {
      const idx = Number(clicked.getAttribute("data-index"));
      const album = albums[idx];
      songList = album.songs.map(f => `songs/${album.folder}/${f}`);

      SongContainer.innerHTML = "";
      album.songs.forEach((f) => {
        const songName = decodeURIComponent(f).replaceAll("%20"," ").replaceAll("/","");
        SongContainer.innerHTML += `
          <li class="song_list cursor" data-folder="songs/${album.folder}/${f}">
            <img class="invert" src="img/music.svg" alt="">
            <div class="list_name">
              <p class="song_name">${songName}</p>
              <p class="author_name">Author Name</p>
            </div>
            <div class="play_now">
              <span>Play Now</span>
              <img class="invert" src="img/play.svg" alt="">
            </div>
          </li>`;
      });

      playSongAt(0);
    }
  });

  //////////////////////////////////////////////////////////////////// If SONG is Clicked
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
        document.querySelector(".time span").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
      });
    }
  });

  /////////////////////////////////////// if VOLUME is adjusted
  volumeSlider.addEventListener("input", () => {
    volume_range = volumeSlider.value / 100;
    if (currentSong) currentSong.volume = volume_range;

    if (volume_range === 0) {
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
      volumeSlider.value = volume_range * 100;
    }
  });

  /////////////////////////////////// PLAY/PAUSE TIME Controls
  PLAY_PAUSE.addEventListener("click", () => {
    if (!currentSong) return;
    if (currentSong.paused) {
      currentSong.play();
      PLAY_PAUSE.src = "img/pause.svg";
    } else {
      currentSong.pause();
      PLAY_PAUSE.src = "img/play.svg";
    }

    currentSong.addEventListener("timeupdate", () => {
      TimeSlider.value = currentSong.currentTime;
      document.querySelector(".time span").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    });
  });

  TimeSlider.addEventListener("input", () => {
    if (currentSong) currentSong.currentTime = TimeSlider.value;
  });

  /////////////////////////////////////PRE  NEXT Controls
  const PRE = document.querySelector(".prev");
  const NEXT = document.querySelector(".next");

  NEXT.addEventListener("click", () => {
    if (currentIndex < songList.length - 1) playSongAt(currentIndex + 1);
  });

  PRE.addEventListener("click", () => {
    if (currentIndex > 0) playSongAt(currentIndex - 1);
  });

  //////////////////////////////// Other Inner Fuctions
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
      document.querySelector(".time span").innerHTML = `00:00 / ${formatTime(currentSong.duration)}`;
    });

    currentSong.addEventListener("timeupdate", () => {
      TimeSlider.value = currentSong.currentTime;
      document.querySelector(".time span").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
    });

    currentSong.play();
    PLAY_PAUSE.src = "img/pause.svg";
    TimeSlider.value = 0;
  }
})();

/////////////////////////////////////////
/////////////////////////////////////////

////////////////// Other fuctions
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60) || 0;
  const secs = Math.floor(seconds % 60) || 0;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}
