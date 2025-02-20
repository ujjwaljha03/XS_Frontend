"use client"

import { useEffect, useState } from "react"
import { useUser } from "../context/UserContext"
import { ArrowLeft, ChevronRightIcon } from "lucide-react"
import api from "../utils/apiCallSyntax"
import { toast } from "react-toastify"
import { FaPlay } from 'react-icons/fa'
import DropdownMenu from "./DropdownMenu"

const SoundCloudSection = ({ isLoggedIn, setIsLoggedIn, onSongSelect, currentSongPlaying }) => {
  const { soundCloudUserId, setSoundCloudUserId } = useUser()
  const [view, setView] = useState("main") // 'main', 'likedSongs', 'playlists', 'playlistSongs'
  const [likedSongs, setLikedSongs] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylistSongs, setSelectedPlaylistSongs] = useState([])
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    try {
      // 🚨 Clear the logout flag before login
      if (localStorage.getItem('soundCloudLoggedOut')) {
        localStorage.removeItem('soundCloudLoggedOut');
      }
      toast.info("Redirecting to login...", { autoClose: 1000, position: "bottom-center" })
      window.location.href = "http://localhost:8080/auth/soundcloud/login"
    } catch (error) {
      toast.error("Login Failed! ", { autoClose: 1000, position: "bottom-center" })
      console.error("Login failed:", error)
    }
  }

  const fetchUserId = async () => {
    try {
      const response = await api.get("/soundcloud/user")
      if (response.data) {
        setSoundCloudUserId(response.data)
        localStorage.setItem("soundCloudUserId", response.data)
        setIsLoggedIn(true)
        toast.success("Login Successful!", { autoClose: 1000, position: "bottom-center" })
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log("User not logged in yet")
      } else {
        console.error("Error fetching user ID:", error)
        toast.error("Error checking login status", { autoClose: 1000, position: "bottom-center" })
      }
    }
  }

  useEffect(() => {
    const storedUserId = localStorage.getItem("soundCloudUserId");
    const logoutFlag = localStorage.getItem('soundCloudLoggedOut'); // 🚨 Check logout flag
    if (storedUserId) {
      setSoundCloudUserId(storedUserId)
      setIsLoggedIn(true)
    } else {
      if (!logoutFlag) {
        fetchUserId()
      }
    }
  }, [])

  const handleLogout = async () => {
    try {
      const storedUserId = localStorage.getItem("soundCloudUserId")
      if (storedUserId) {

        await api.post("/soundcloud/logout")

        localStorage.removeItem("soundCloudUserId")
        localStorage.setItem('soundCloudLoggedOut', 'true'); // 🚨 Set logout flag
        setSoundCloudUserId(null)
        setIsLoggedIn(false)
        toast.success("Logout Successful!", { autoClose: 1000, position: "bottom-center" })
      }
      else {
        return;
      }
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Logout failed!", { autoClose: 1000, position: "bottom-center" })
    }
  }

  const fetchLikedSongs = async () => {
    setLoading(true);  // Set loading to true before API call
    setError(false); // no error before API call
    try {
      const response = await api.get(`/soundcloud-liked-songs?soundcloudUserId=${soundCloudUserId}`)
      setLikedSongs(response.data)
      setView("likedSongs")
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      } else {
        console.error("Error fetching liked songs:", error)
        toast.error("Failed to fetch liked songs", { autoClose: 1000, position: "bottom-center" })
      }
    }
    finally {
      setLoading(false);  // Set loading to false after API call
    }
  }

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get(`/soundcloud-playlists?soundcloudUserId=${soundCloudUserId}`)
      setPlaylists(response.data)
      setView("playlists")
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      } else {
        console.error("Error fetching playlists:", error)
        toast.error("Failed to fetch playlists", { autoClose: 1000, position: "bottom-center" })
      }
    } finally {
      setLoading(false);
    }
  }

  const fetchPlaylistSongs = async (playlistTracks) => {
    setLoading(true);
    setError(false);
    try {
      setSelectedPlaylistSongs(playlistTracks);
      setView("playlistSongs")
    } catch (error) {
      if (error.request) {
        setError(" Network Error!");
      } else {
        console.error("Error fetching playlist songs:", error)
        toast.error("Failed to fetch playlist songs", { autoClose: 1000, position: "bottom-center" })
      }
    } finally {
      setLoading(false);
    }
  }

  const handleClick = (song) => {
    let queue = [];
    queue = view === 'likedSongs' ? likedSongs : selectedPlaylistSongs;
    const songIndex = queue.findIndex((s) => s === song);
    const nextSongsQueue = queue.slice(songIndex + 1);
    // setSongQueue(nextSongsQueue);
    onSongSelect(song, "soundcloud", nextSongsQueue);
  };

  return (
    <div className="w-1/3 bg-gradient-to-b from-[#fb3200] to-[#953115] p-4 overflow-hidden">
      {isLoggedIn ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img src="/soundcloud-logo3.jpg" alt="SoundCloud" className="w-8 h-8 mr-2" />
              <h2 className="text-xl font-bold">SoundCloud</h2>
            </div>
            {isLoggedIn && (<DropdownMenu handleLogout={handleLogout} platform={'soundcloud'} />
            )}
          </div>
          <hr className="border-gray-700 mb-4" />

          {/* to display any networ error*/}
          {error && (
            <div className="flex justify-center items-center text-red-500">
              <p>{error}</p>
            </div>
          )}

          {/* Show loading effect when fetching data */}
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
              <p className="ml-2 text-white">Loading...</p>
            </div>
          ) : null}

          {view === "main" && (
            <div>
              <div className="flex flex-col space-y-2">
                <div
                  className="flex items-center justify-between p-3 bg-orange-700 rounded hover:bg-orange-800 cursor-pointer"
                  onClick={fetchLikedSongs}
                >
                  <div className="flex items-center justify-between w-full mb-2">

                    <span className="text-white">Liked Songs</span>
                    <ChevronRightIcon size={20} className="text-white" />
                  </div>
                </div>
                <div
                  className="flex items-center justify-between p-3 bg-orange-700 rounded hover:bg-orange-800 cursor-pointer"
                  onClick={fetchPlaylists}
                >
                  <div className="flex items-center justify-between w-full mb-2">

                    <span className="text-white">Your Playlists</span>
                    <ChevronRightIcon size={20} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {view === "likedSongs" && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView("main")} />
                <h3 className="text-lg font-semibold text-white ml-2">Liked Songs</h3>
              </div>
              <div className=" scrollable-2 overflow-x-hidden overflow-y-auto" style={{ height: "80vh" }}>
                {likedSongs.map((song, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-2 mb-2 rounded cursor-pointer transform transition-all duration-300 ease-in-out
                      ${currentSongPlaying && currentSongPlaying.permalinkUrl === song.permalink_url ? "bg-gradient-to-b from-[#fb3200] to-[#953115] text-black scale-105" : "text-white"} // Apply styles for selected/unselected songs
                      hover:bg-gradient-to-b hover:from-[#fb3200] hover:to-[#953115] hover:text-black hover:scale-105 hover:transition-transform`}
                    onClick={() => handleClick(song)}
                    style={{
                      whiteSpace: "nowrap", // Prevent text from wrapping
                      transformOrigin: "left", // Ensure scaling happens from the center
                      padding: "12px", // Adjust padding as needed to make sure the text fits
                    }
                    }
                  >
                    {/* Play button fixed size will never move with flex-shrink-0 */}
                    <FaPlay
                      className={`mr-2 flex-shrink-0 ${currentSongPlaying && currentSongPlaying.permalinkUrl === song.permalink_url ? "text-black" : "text-white"} hover:text-black`}
                      style={{ fontSize: "16px" }}
                    />
                    {/* Song title (Will truncate if too long by text-ellipsis and overflowhidden) */}
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {song.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "playlists" && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView("main")} />
                <h3 className="text-lg font-semibold text-white ml-2">Your Playlists</h3>
              </div>
              <div className=" overflow-x-hidden scrollable-2 overflow-y-auto cursor-pointer">
                {playlists.map((playlist, index) => (
                  <div
                    key={index}
                    className=" flex items-center justify-between mr-2 p-2 text-white rounded 
                    hover:bg-gradient-to-b hover:from-[#fb3200] hover:to-[#953115] hover:text-black hover:scale-105 hover:transition-transform"
                    onClick={() => fetchPlaylistSongs(playlist.tracks)}
                    style={{
                      whiteSpace: "nowrap", // Prevent text from wrapping
                      transformOrigin: "left", // Ensure scaling happens from the center
                      padding: "12px", // Adjust padding as needed to make sure the text fits
                    }
                    }
                  >
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {playlist.title}
                    </span>
                    <ChevronRightIcon size={20} className="text-white" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === "playlistSongs" && (
            <div>
              <div className="flex items-center mb-4">
                <ArrowLeft className="text-white cursor-pointer" size={24} onClick={() => setView("playlists")} />
                <h3 className="text-lg font-semibold text-white ml-2">Playlist Songs</h3>
              </div>
              <div className=" scrollable-2 overflow-x-hidden overflow-y-auto" style={{ height: "80vh" }}>
                {selectedPlaylistSongs.map((song, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-2 mb-2 rounded cursor-pointer transform transition-all duration-300 ease-in-out
                      ${currentSongPlaying && currentSongPlaying.permalinkUrl === song.permalink_url ? "bg-gradient-to-b from-[#fb3200] to-[#953115] text-black scale-105" : "text-white"} // Apply styles for selected/unselected songs
                      hover:bg-gradient-to-b hover:from-[#fb3200] hover:to-[#953115] hover:text-black hover:scale-105 hover:transition-transform`}
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
                      className={`mr-2 flex-shrink-0 ${currentSongPlaying && currentSongPlaying.permalinkUrl === song.permalink_url ? "text-black" : "text-white"} hover:text-black`}
                      style={{ fontSize: "16px" }}
                    />
                    {/* Song title */}
                    <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                      {song.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex items-center justify-center h-full">
          <button onClick={handleLogin} className="bg-white text-orange-600 px-6 py-3 rounded-full text-lg">
            Login with SoundCloud
          </button>
        </div>
      )}
    </div >
  )
}

export default SoundCloudSection
