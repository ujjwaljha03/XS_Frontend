'use client'

import React, { createContext, useState, useContext } from 'react'

const UserContext = createContext(undefined)

export const UserProvider = ({ children }) => {
  const [spotifyUserId, setSpotifyUserId] = useState(null)
  const [soundCloudUserId, setSoundCloudUserId] = useState(null)

  const setSpotifyUserIdWrapper = (id) => {
    setSpotifyUserId(id)
    if (id) {
      localStorage.setItem('spotifyUserId', id)
    } else {
      localStorage.removeItem('spotifyUserId')
    }
  }

  const setSoundCloudUserIdWrapper = (id) => {
    setSoundCloudUserId(id)
    if (id) {
      localStorage.setItem('soundCloudUserId', id)
    } else {
      localStorage.removeItem('soundCloudUserId')
    }
  }

  return (
    <UserContext.Provider
      value={{
        spotifyUserId,
        soundCloudUserId,
        setSpotifyUserId: setSpotifyUserIdWrapper,
        setSoundCloudUserId: setSoundCloudUserIdWrapper,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = () => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}