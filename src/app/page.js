'use client'

import { useState, useEffect } from 'react'
import SpotifySection from '../app/components/SpotifySection'                                         // '../components/SpotifySection'
import NowPlayingSection from '../app/components/NowPlayingSection'
import SoundCloudSection from '../app/components/SoundCloudSection'
import { UserProvider } from '../app/context/UserContext'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function Home() {
  const [isSpotifyLoggedIn, setIsSpotifyLoggedIn] = useState(false)
  const [isSoundCloudLoggedIn, setIsSoundCloudLoggedIn] = useState(false)
  const [selectedSong, setSelectedSong] = useState();
  const [platform, setPlatform] = useState("");
  const [songQueue, setSongQueue] = useState([]);

  const handleSongSelect = (song, platformName, songsQueue) => {
    if (!song) {
      setSongQueue(null);
      setSelectedSong(null);
      return;
    }
    if (platformName === 'soundcloud') {
      setSelectedSong({
        title: song.title,
        permalinkUrl: song.permalink_url,
        artworkUrl: song.artwork_url,
        duration: song.duration,
      });
    }
    else if (platformName === 'spotify') {
      if (!song.track) {
        console.error("Spotify song.track is undefined:");
        return;
      }

      setSelectedSong({
        title: song.track.name,
        duration: song.track.duration_ms,
        artist: song.track.artists.map(artist => artist.name).join(", "),
        image: song.track.album.images[0].url,
        trackUri: song.track.uri,
      });
    }
    setPlatform(platformName);
    setSongQueue(songsQueue);
  };

  function updateQueueAndSong(nextSong, remainingQueue, platform) {
    handleSongSelect(nextSong, platform, remainingQueue);
  }

  useEffect(() => {
    const spotifyUserId = localStorage.getItem('spotifyUserId')
    const soundCloudUserId = localStorage.getItem('soundCloudUserId')
    if (spotifyUserId) {
      setIsSpotifyLoggedIn(true);
    }
    if (soundCloudUserId) {
      setIsSoundCloudLoggedIn(true);
    }
  }, [isSpotifyLoggedIn, isSoundCloudLoggedIn])

  return (
    <UserProvider>
      <main className="flex min-h-screen bg-gray-900 text-white">
        <ToastContainer position='bottom' closeOnClick autoClose={2000} pauseOnHover={false} theme='dark' />
        <SpotifySection isLoggedIn={isSpotifyLoggedIn} setIsLoggedIn={setIsSpotifyLoggedIn} onSongSelect={handleSongSelect} currentSongPlaying={selectedSong} />
        <NowPlayingSection soundcloundLoggedIn={isSoundCloudLoggedIn} spotifyLoggedIn={isSpotifyLoggedIn} songData={selectedSong} platform={platform} songsQueue={songQueue} updateCurrentSong={updateQueueAndSong} />
        <SoundCloudSection isLoggedIn={isSoundCloudLoggedIn} setIsLoggedIn={setIsSoundCloudLoggedIn} onSongSelect={handleSongSelect} currentSongPlaying={selectedSong} />
      </main>
    </UserProvider>
  )
}
// toast.success('Login Successful!', {
//   position: 'top-right',
//   autoClose: 3000,
//   hideProgressBar: false,
//   closeOnClick: true,
//   pauseOnHover: true,
//   draggable: true,
//   theme: 'dark',
// });