import { useEffect, useState, useSyncExternalStore } from 'react'
import { createLiveFeed, type LiveFeed } from '../services/liveFeed'

export const useLiveStream = (): LiveFeed => {
  const [feed] = useState(createLiveFeed)

  useEffect(() => {
    feed.start()
    return feed.stop
  }, [feed])

  return feed
}

export const useConnection = (feed: LiveFeed) =>
  useSyncExternalStore(feed.subscribeConnection, feed.getConnection)

export const useFeed = (feed: LiveFeed) => useSyncExternalStore(feed.subscribeFeed, feed.getFeed)
