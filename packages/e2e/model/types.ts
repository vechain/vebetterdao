
// A users allocation vote
export type AllocationVote = {
    appName: string,
    votePercentage: number
}

// app name
export type AppName = 'Vyvo' | 'Mugshot' | 'Cleanify'

// app details
export type AppDetails = {
    name?: string,
    description?: string,
    projectUrl?: string,
    walletAddress?: string,
    logoFilePath?: string,
    bannerFilePath?: string,
}
