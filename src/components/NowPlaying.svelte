<script lang="ts">
  import { onMount } from "svelte";

  interface Player {
    isPlaying: boolean;
    title?: string;
    artist?: string;
    album?: string;
    albumImageUrl?: string;
    songUrl?: string;
    duration?: number;
    progress?: number;
  }

  let player: Player = { isPlaying: false };
  let interval: ReturnType<typeof setInterval>;

  async function fetchNowPlaying() {
    try {
      const res = await fetch("/api/spotify.json");

      if (!res.ok) throw new Error("Fetch failed");
      let data;
      try {
        data = await res.json();
      } catch (jsonErr) {
        const cached = localStorage.getItem("playerCache");
        player = cached ? JSON.parse(cached) : { isPlaying: false };
        return;
      }
      if (
        data &&
        (data.title || data.songUrl || data.artist || data.albumImageUrl)
      ) {
        player = { ...data };
        localStorage.setItem("playerCache", JSON.stringify(player));
      } else {
        const cached = localStorage.getItem("playerCache");
        player = cached ? JSON.parse(cached) : { isPlaying: false };
      }
    } catch (err) {
      const cached = localStorage.getItem("playerCache");
      player = cached ? JSON.parse(cached) : { isPlaying: false };
    }
  }

  onMount(() => {
    const cached = localStorage.getItem("playerCache");
    if (cached) {
      try {
        player = JSON.parse(cached);
      } catch (e) {
        player = { isPlaying: false };
      }
    }
    fetchNowPlaying();
    interval = setInterval(fetchNowPlaying, 5000);
    return () => clearInterval(interval);
  });
  $: statusText = player.isPlaying
    ? "Now playing -"
    : player.title || player.artist || player.album
      ? "Last played -"
      : "I'm not playing anything on Spotify right now!";
</script>

<div class="flex flex-row items-center gap-4 text-left w-full h-full">
  {#if player.songUrl}
    <a href={player.songUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={player.albumImageUrl}
        alt={player.album}
        class="w-81 h-auto object-cover rounded-lg shadow-md transition-transform duration-200 hover:scale-105"
      />
    </a>
  {/if}

  <div class="relative w-full max-w-xl">
    <div
      class="transition-opacity duration-150 opacity-100 group-hover:opacity-0"
    >
      {statusText}
      <p class="font-semibold w-full truncate">{player.title}</p>
      <p class="text-black font-bold w-full truncate">{player.album}</p>
      <p class="text-gray-600 w-full truncate">{player.artist}</p>

      {#if player.duration && player.progress != null}
        <div class="w-64 h-2 bg-gray-300 rounded overflow-hidden mt-2">
          <div
            class="h-2 bg-green-500 rounded transition-all duration-150"
            style="width: {Math.min(
              (player.progress / player.duration) * 100,
              100
            )}%"
          ></div>
        </div>
      {/if}
    </div>
    <div
      class="absolute inset-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-150"
    >
      {#if false}
        <h1 class="text-white font-semibold">/hobbies/music</h1>
        <p class="text-white whitespace-normal break-words w-full">
          I love listening to different genres of music like rap, jazz, and
          funk. I also play the tenor saxophone.
        </p>
      {:else}
        <p class="text-white whitespace-normal break-words w-full">Nothing here either!</p>
      {/if}
    </div>
  </div>
</div>
