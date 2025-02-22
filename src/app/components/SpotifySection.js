'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '../context/UserContext'
import { ArrowLeft, ChevronRightIcon } from 'lucide-react'
import api from '../utils/apiCallSyntax'
import { toast } from 'react-toastify'
import { FaPlay } from 'react-icons/fa'
import DropdownMenu from './DropdownMenu'

const SpotifySection = ({ isLoggedIn, setIsLoggedIn, onSongSelect, currentSongPlaying }) => {
  const { spotifyUserId, setSpotifyUserId } = useUser()
  const [view, setView] = useState('main') // 'main', 'likedSongs', 'playlists', 'playlistSongs'
  const [likedSongs, setLikedSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const handleLogin = async () => {
    try {
      // 🚨 Clear the logout flag before login
      if (localStorage.getItem('spotifyLoggedOut')) {
        localStorage.removeItem('spotifyLoggedOut');
      }

      toast.info('Redirecting to login...', { autoClose: 1000, position: "bottom-center" });

      // Redirect to Spotify login
      window.location.href = 'http://localhost:8080/spotify-login';
    } catch (error) {
      toast.error("Login Failed!", { autoClose: 1000, position: "bottom-center" });
    }
  };


  const fetchUserId = async () => {
    try {
      const response = await api.get('/spotify-user')
      if (response.data) {
        setSpotifyUserId(response.data.userId);               //  NEW CHNAGE HERE now my backend is returning map<String,String>
        localStorage.setItem('spotifyUserId', response.data.userId)
        if (response.data.product === "premium") { localStorage.setItem("isPremium", true); }
        else { localStorage.setItem("isPremium", false); }
        setIsLoggedIn(true)
        toast.success('Login Successful!', { autoClose: 1000, position: 'bottom-center' })
      }
    } catch (error) {
      if (error.message.includes("ERR_CONNECTION_REFUSED")) {
        toast.info("Server not Connected!",{autoClose: 1000, position: "bottom-center"})
      }
      else {
        toast.error("Error checking login status", { autoClose: 1000, position: "bottom-center" })
      }
      // Don't call handleLogout here, as the user might not be logged in yet
    }
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem('spotifyUserId');
    const logoutFlag = localStorage.getItem('spotifyLoggedOut'); // 🚨 Check logout flag

    if (storedUserId && !logoutFlag) {
      setSpotifyUserId(storedUserId);
      setIsLoggedIn(true);
    } else if (!logoutFlag) {  // 🚨 Prevent auto-login if user logged out
      fetchUserId();
    }
  }, [isLoggedIn]); // Re-run only when `isLoggedIn` changes

  const handleLogout = async () => {
    try {
      const storedUserId = localStorage.getItem('spotifyUserId');
      if (storedUserId) {
        await api.post('/spotify-logout', { userId: storedUserId });  // Send as JSON and requestBody

        // Clear login data
        localStorage.removeItem('spotifyUserId');
        localStorage.setItem('spotifyLoggedOut', 'true'); // 🚨 Set logout flag
        setSpotifyUserId(null);
        setIsLoggedIn(false);
        toast.success('Logout Successful!', { autoClose: 1000, position: 'bottom-center' });
      }
    } catch (error) {
      toast.error('Logout failed!', { autoClose: 1000, position: 'bottom-center' });
    }
  };



  const fetchLikedSongs = async () => {
    setLoading(true); // Set loading to true before API call
    setError(null); // no error before call
    try {
      const response = await api.get(`/spotify-liked-songs?spotifyUserId=${spotifyUserId}`)

      setLikedSongs(response.data)
      setView('likedSongs')
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      }
    }
    finally {
      setLoading(false); // Set loading to false after API call
    }
  }

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/spotify-playlists?spotifyUserId=${spotifyUserId}`);

      setPlaylists(response.data)
      setView('playlists')
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchPlaylistSongs = async (playlistId) => {
    setLoading(true);
    setError(null);
    try {
      // VVVIP HUMNAIN PLAYLIST ID JAISE IDHAR DI HAI USKA MATLAB YE URL KE SATH JAYEGA, TOH ISKO BACKEDN MAIN HUM AS @PATHVARAIBLE KI TARAH USE KARENGE AND BAKCEND WILL LOKE(/SPOTIFY-PLAYLIST-TRACKS/{PLAYLISTID})
      // IF AGR AISE DETE LIKE THIS(`HTTP...?PLAYLISTID=${PLAYLISTID}`), JUST USE @REQUESTPARAM FOR CONTROLLER MAPPING (/SPOTIFY-PLAYLST-TRACKS) BAS.

      const response = await api.get(`/spotify-playlist-tracks/${playlistId}?spotifyUserId=${spotifyUserId}`);
      setSelectedPlaylistSongs(response.data)
      setView('playlistSongs')
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      }
    }
    finally {
      setLoading(false);
    }
  }

  const handleClick = async (song) => {
    let queue = [];
    queue = view === 'likedSongs' ? likedSongs : selectedPlaylistSongs;
    const songIndex = queue.findIndex((s) => s === song);
    const nextSongsQueue = queue.slice(songIndex + 1);
    onSongSelect(song, "spotify", nextSongsQueue);
  };
  return (
    <div className="w-1/3 bg-gradient-to-b from-[#5038a0] to-[#221b44] p-4 overflow-hidden">
      {isLoggedIn ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img src="/Spotify_Primary_Logo_RGB_Green.png" alt="Spotify" className="w-8 h-8 mr-2" />
              <h2 className="text-xl font-bold">Spotify</h2>
            </div>
            {isLoggedIn && (<DropdownMenu handleLogout={handleLogout} platform={'spotify'} />
            )}
          </div>
          <hr className="border-gray-900 mb-4" />

          {/* to display any networ error*/}
          {error && (
            <div className="flex justify-center items-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {/* Show loading effect when fetching data */}
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="ml-2 text-white">Loading...</p>
            </div>
          ) : null}

          {view === 'main' && (
            <div>
              <div className="flex flex-col space-y-2">
                <div
                  className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={fetchLikedSongs}
                >
                  <div className="flex items-center">
                    <img src="/spotifyLikedSongs.png" alt="HeartIcon" className="w-8 h-8 mr-2" />
                    <span className="text-white">Liked Songs</span>
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-gray-800 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={fetchPlaylists}
                >
                  <div className="flex items-center">
                    <img src="/SpotifyPlaylist.png" alt="PlayListIcon" className="w-8 h-8 mr-2" />
                    <span className="text-white">Your Playlists</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === 'likedSongs' && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView('main')} />
                <h3 className="text-lg font-semibold text-white ml-2">Liked Songs</h3>
              </div>
              <div className=" scrollable-1 overflow-x-hidden overflow-y-auto" style={{ height: "80vh" }}>
                {likedSongs.map((song, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-2 mb-2 rounded cursor-pointer transform transition-all duration-300 ease-in-out
                      ${currentSongPlaying && currentSongPlaying.trackUri === song.track.uri ? "bg-gradient-to-b from-[#6741c7] to-[#2f2363] text-black scale-105" : "text-white"} // Apply styles for selected/unselected songs
                      hover:bg-gradient-to-b hover:from-[#6741c7] hover:to-[#2f2363] hover:text-black hover:scale-105 hover:transition-transform`}
                    onClick={() => handleClick(song)}
                    style={{
                      whiteSpace: "nowrap", // Prevent text from wrapping
                      transformOrigin: "left", // Ensure scaling happens from the center
                      padding: "12px", // Adjust padding as needed to make sure the text fits
                    }
                    }
                  >
                    {/* {/* Play button fixed size will never move with flex-shrink-0 * */}
                    <FaPlay
                      className={`mr-2 flex-shrink-0  ${currentSongPlaying && currentSongPlaying.trackUri === song.track.uri ? "text-black" : "text-white"} hover:text-black`}
                      style={{ fontSize: "16px" }}
                    />
                    {/* Song name (Will truncate if too long by text-ellipsis and overflowhidden)*/}
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {song.track.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'playlists' && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView('main')} />
                <h3 className="text-lg font-semibold text-white ml-2">Your Playlists</h3>
              </div>
              <div className=" scrollable-1 overflow-x-hidden overflow-y-auto" style={{ height: "80vh" }}>
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className=" flex items-center justify-between mr-2 p-2 text-white rounded cursor-pointer 
                    hover:bg-gradient-to-b hover:from-[#6741c7] hover:to-[#2f2363] hover:text-black hover:scale-105 hover:transition-transform"
                    onClick={() => fetchPlaylistSongs(playlist.id)}
                    style={{
                      whiteSpace: "nowrap", // Prevent text from wrapping
                      transformOrigin: "left", // Ensure scaling happens from the center
                      padding: "12px", // Adjust padding as needed to make sure the text fits
                    }
                    }
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {playlist.name}
                    </span>
                    <ChevronRightIcon size={20} className="text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'playlistSongs' && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView('playlists')} />
                <h3 className="text-lg font-semibold text-white ml-2">Playlist Songs</h3>
              </div>
              <div className=" scrollable-1 overflow-x-hidden overflow-y-auto" style={{ height: "80vh" }}>
                {selectedPlaylistSongs.map((song, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-2 mb-2 rounded cursor-pointer transform transition-all duration-300 ease-in-out
              ${currentSongPlaying && currentSongPlaying.trackUri === song.track.uri ? "bg-gradient-to-b from-[#6741c7] to-[#2f2363] text-black scale-105" : "text-white"} // Apply styles for selected/unselected songs
              hover:bg-gradient-to-b hover:from-[#6741c7] hover:to-[#2f2363] hover:text-black hover:scale-105 hover:transition-transform`}
                    onClick={() => handleClick(song)}
                    style={{
                      whiteSpace: "nowrap", // Prevent text from wrapping
                      transformOrigin: "left", // Ensure scaling happens from the center
                      padding: "12px", // Adjust padding as needed to make sure the text fits
                    }
                    }
                  >
                    {/* Play button */}
                    <FaPlay
                      className={`mr-2 flex-shrink-0 ${currentSongPlaying && currentSongPlaying.trackUri === song.track.uri ? "text-black" : "text-white"} hover:text-black`}
                      style={{ fontSize: "16px" }}
                    />
                    {/* Song name */}
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {song.track.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <button onClick={handleLogin} className="bg-green-500 text-white px-6 py-3 rounded-full text-lg">
            Login with Spotify
          </button>
        </div>
      )}
    </div>
  )
}

export default SpotifySection
