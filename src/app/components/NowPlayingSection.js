'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, } from 'lucide-react'
import ReactPlayer from 'react-player';
import api from '../utils/apiCallSyntax'
import { toast } from 'react-toastify';

const NowPlayingSection = ({ soundcloundLoggedIn, spotifyLoggedIn, songData, platform, songsQueue, updateCurrentSong }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [spotifyPlayer, setSpotifyPlayer] = useState(null);
  const playerReff = useRef(null);
  let squeue = songsQueue;

  useEffect(() => {
    if (soundcloundLoggedIn == false && platform === 'soundcloud') {
      setIsPlaying(false);
      setTotalTime(0);
      setCurrentTime(0);
      handleSongEnd();
    }
  }, [soundcloundLoggedIn])

  useEffect(() => {
    if (spotifyLoggedIn == false && platform === 'spotify') {
      setIsPlaying(false);
      setTotalTime(0);
      setCurrentTime(0);
      // **Forcefully Pause and Disconnect Spotify Player**
      if (spotifyPlayer) {
        spotifyPlayer.pause().then(() => {
          console.log("Spotify playback paused due to logout.");
        });

        spotifyPlayer.disconnect(); // Disconnect player instance
        setSpotifyPlayer(null); // Reset player state
      }
      handleSongEnd();
      return;
    }
    const storedUserId = localStorage.getItem('spotifyUserId');
    if (!storedUserId) {
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'XStreamer Player',
        getOAuthToken: async (cb) => {
          const response = await api.get(`/spotify-access-token?userId=${storedUserId}`);
          if (response.status === 200) {
            cb(response.data.token);
          } else {
            console.error('Error fetching Spotify token');
          }
        },
        volume: 0.5,
      });

      player.addListener('ready', ({ device_id }) => {
        localStorage.setItem('spotifyDeviceId', device_id);
      });

      player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
      });

      setSpotifyPlayer(player);
      player.connect();
      console.log("Spotify SDK is ready!");
    };

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);


    // Cleanup function to unmount player
    return () => {
      if (spotifyPlayer) {
        console.log("Disconnecting Spotify Player...");
        spotifyPlayer.disconnect(); // Properly disconnect the player
        setSpotifyPlayer(null); // Reset state
      }
    };
  }, [spotifyLoggedIn]);

  useEffect(() => {
    let interval;

    if (platform === "spotify" && spotifyPlayer) {
      interval = setInterval(async () => {
        const state = await spotifyPlayer.getCurrentState();
        if (state) {
          setCurrentTime(state.position / 1000); // Convert from milliseconds to seconds
          setTotalTime(state.duration / 1000);
        }
      }, 1000);
    }

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [platform, spotifyPlayer]);

  useEffect(() => {
    if (songData) {
      async function playSong() {
        if (platform === 'soundcloud') {
          if (spotifyPlayer && isPlaying) {
            spotifyPlayer.pause(); // Explicitly pause Spotify
          }
        }
        else if (platform === 'spotify') {
          const isPremium = localStorage.getItem("isPremium");
          if (!isPremium) {
            toast.error("Only for Premium Members!", { autoClose: 1000, position: 'bottom-center' });
            return;
          }
          const storedDeviceId = localStorage.getItem('spotifyDeviceId');
          if (!storedDeviceId) {
            toast.error("Spotify Player not initialized!", { autoClose: 1000, position: 'bottom-center' });
            return;
          }
          if (spotifyLoggedIn) {
            try {
              if (isPlaying) {
                await spotifyPlayer.pause();
                await api.put(`/spotify-play`, {
                  userId: localStorage.getItem('spotifyUserId'),
                  uri: songData.trackUri,
                  deviceId: storedDeviceId
                });
              }
              else {
                await api.put(`/spotify-play`, {
                  userId: localStorage.getItem('spotifyUserId'),
                  uri: songData.trackUri,
                  deviceId: storedDeviceId
                });
              }
            } catch (error) {
              toast.error("Song Cannot be Played!", { autoClose: 1000, position: 'bottom-center' });
            }
          }
        }
      }
      playSong();
      setCurrentTime(0);
      setIsPlaying(true);
      setTotalTime(songData.duration / 1000);
    }
  }, [songData, songsQueue]);

  useEffect(() => {
    if (!spotifyPlayer) return;

    const handleStateChange = (state) => {
      if (!state || !state.track_window || !state.track_window.current_track) return;

      setIsPlaying(!state.paused);

      // ✅ Check if the song ended (only if it's not a user seek event)
      const isSongEnded = state.paused && state.position === 0 && state.track_window.previous_tracks.length > 0;
      if (isSongEnded) {
        handleSongEnd(); // Automatically play the next song
      }
    };
    spotifyPlayer.addListener("player_state_changed", handleStateChange);

    return () => {
      spotifyPlayer.removeListener("player_state_changed", handleStateChange);
    };
  }, [spotifyPlayer, songData]);

  const skipTime = (time) => {
    if (platform === 'soundcloud' && playerReff) {
      setCurrentTime((prevTime) => {
        const newTime = Math.max(0, prevTime + time);
        playerReff.current.seekTo(newTime, 'seconds');
        return newTime;
      })
    }
    else if (platform === 'spotify' && spotifyPlayer) {
      setCurrentTime((prevTime) => {
        const newTime = Math.max(0, prevTime + time);
        spotifyPlayer.seek(newTime * 1000);
        return newTime;
      })
    }
  }

  const togglePlay = async () => {

    if (platform === 'soundcloud') {
      if (isPlaying) {
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
      }
    }

    else if (platform === 'spotify') {
      const isPremium = localStorage.getItem("isPremium");

      if (!isPremium) {
        toast.error("Only for Premium Members!", { autoClose: 1000, position: 'bottom-center' });
        return;
      }

      const storedDeviceID = localStorage.getItem('spotifyDeviceId');
      if (!storedDeviceID) {
        toast.error("Spotify Player not initialized!", { autoClose: 1000, position: 'bottom-center' });
        return;
      }
      try {
        if (isPlaying) {

          await spotifyPlayer.pause();
        } else {

          await spotifyPlayer.resume();
        }
        setIsPlaying(!isPlaying);
      } catch (error) {

        toast.error("Refresh the page!", { autoClose: 1000, position: 'bottom-center' });
      }
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSongEnd = () => {
    if (!spotifyLoggedIn && platform === 'spotify') {
      updateCurrentSong(null, null, null);
      return;
    }
    else if (!soundcloundLoggedIn && platform === 'soundcloud') {
      updateCurrentSong(null, null, null);
      return;
    }
    setCurrentTime(totalTime);
    if (squeue && squeue.length > 0) {
      const [nextSong, ...remainingQueue] = squeue;

      // console.log(" setting Next song: ", nextSong);
      // console.log(" setting Updated queue: ", remainingQueue);

      // Call the parent function to update songData in Page.js

      updateCurrentSong(nextSong, remainingQueue, platform);

      setTimeout(() => {
        setIsPlaying(true); // Ensure playback starts for the next song
      }, 1000); // Small delay to prevent UI glitches

    } else {
      toast.info("Next songs Queue is empty!", { autoClose: 1000, position: "bottom-center" });
      setIsPlaying(false);
    }
  };
  return (
    <div className="w-2/3 bg-gray-800 p-4 flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center">
        <img
          src={
            songData
              ? songData.image || songData.artworkUrl || "/gokuHeadPhones.jpg"
              : "/gokuHeadPhones.jpg"
          }
          alt="Album Art"
          className="w-64 h-64 rounded-lg shadow-lg mb-4"
        />
        <h2 className="text-2xl whitespace-nowrap overflow-hidden font-bold mb-2">{songData ? songData.title : "SONG"}</h2>
        {songData?.artist && songData.artist !== "" ? <p className='text-xl-600 font-bold mb-2'>{songData.artist}</p> : null}
        {songData ? <p className="text-gray-400">{platform === "soundcloud" ? "SoundCloud" : "Spotify"}</p> : <p className="text-gray-400">PLATFORM</p>}
      </div>
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">{formatTime(currentTime)}</span>

          {/* Slider for progress */}
          <input
            className="w-full mx-2"
            type="range"
            min="0"
            max={totalTime}
            value={currentTime}
            onChange={platform === 'spotify' ? (e) => {
              const newTime = Number(e.target.value);
              setCurrentTime(newTime); // Update UI
              spotifyPlayer.seek(newTime * 1000); // Seek in milliseconds as Spotify works in milliseconds
            } :
              (e) => {
                const newTime = Number(e.target.value);
                setCurrentTime(newTime);
                playerReff.current.seekTo(newTime, 'seconds');  // as soundcloud works in seconds
              }
            }
          />

          <span className="text-sm">{formatTime(songData ? songData.duration / 1000 : 0)}</span>
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button className="text-gray-400 hover:text-white on" onClick={() => skipTime(-10)}>
            <SkipBack size={24} />
          </button>
          <button className="bg-white text-black rounded-full p-2" onClick={togglePlay}>
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button className="text-gray-400 hover:text-white" onClick={() => { skipTime(10) }}>
            <SkipForward size={24} />
          </button>
        </div>
      </div>

      {/* ReactPlayer Integration for SoundCloud */}
      {platform === "soundcloud" && songData && (
        <ReactPlayer
          ref={playerReff}
          url={songData.permalinkUrl}
          playing={isPlaying}
          onDuration={(duration) => setTotalTime(duration)} // Set total duration for SoundCloud
          onProgress={({ playedSeconds }) => setCurrentTime(playedSeconds)} // Update current time
          onEnded={handleSongEnd}
          width="0"
          height="0" // To hide the player itself
        />
      )}
    </div>
  )
}

export default NowPlayingSection
