type FreshdeskQueryResult<T> = {
  results: T[]
}
export type FreshdeskTicket = {
  id: number
  description?: string
  subject: string
  priority: number
  status: number
  group_id: number
  type: string
  email: string
  custom_fields: {
    cf_app_name: string
    cf_app_url_optional: string
    cf_github_username: string
    cf_x_username?: string
    cf_admin_wallet_address: string
    cf_app_creator_email: string
    cf_app_creator_name_optional: string
    cf_testnet_project_url: string
    cf_testnet_app_id: string
    cf_distribution_startegy: string
    cf_security_api_security_measures?: boolean
    cf_security_action_verification: boolean
    cf_security_device_fingerprint?: boolean
    cf_security_secure_key_management?: boolean
    cf_security_anti_farming?: boolean
  }
  created_at: string
}
export type FreshdeskTicketBody = {
  description: string
  subject: string
  priority?: number
  status?: number
  group_id?: number
  type?: string
  email: string
  custom_fields?: {
    cf_app_name: string
    cf_app_url_optional?: string
    cf_github_username: string
    cf_x_username?: string
    cf_admin_wallet_address: string
    cf_app_creator_email: string
    cf_app_creator_name_optional?: string
    cf_testnet_project_url: string
    cf_testnet_app_id: string
    cf_distribution_startegy: string
    cf_security_api_security_measures?: boolean
    cf_security_action_verification: boolean
    cf_security_device_fingerprint?: boolean
    cf_security_secure_key_management?: boolean
    cf_security_anti_farming?: boolean
  }
}

export interface TicketResponse {
  id: number
  description: string
  subject: string
}

export enum HumanizedTicketStatus {
  Open = "Open",
  Pending = "Pending",
  Resolved = "Resolved",
  Closed = "Closed",
  WaitingOnCustomer = "Waiting on Customer",
  WaitingOnDev = "Waiting on Dev",
  Unknown = "Unknown",
}

export enum TicketStatus {
  Open = 2,
  Pending = 3,
  Resolved = 4,
  Closed = 5,
  WaitingOnCustomer = 6,
  WaitingOnDev = 7,
  Unknown = 0,
}

enum TicketPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}

class FreshdeskClient {
  private readonly apiKey: string
  private readonly baseURL: URL
  private readonly DEFAULT_PRIORITY = TicketPriority.Low
  private readonly DEFAULT_STATUS = TicketStatus.Pending
  private readonly DEFAULT_TYPE = "Other"

  constructor(apiKey: string, freshdeskDomain: string) {
    if (!apiKey) {
      throw new Error("API key is required")
    }
    if (!freshdeskDomain) {
      throw new Error("Freshdesk domain is required")
    }

    this.apiKey = apiKey
    this.baseURL = new URL("/api/v2", freshdeskDomain)
  }

  private async request({
    endpoint,
    method = "GET",
    body,
  }: {
    endpoint: string
    method?: RequestInit["method"]
    body?: FreshdeskTicketBody
  }): Promise<Response> {
    let url = `${this.baseURL.toString().replace(/\/$/, "")}${endpoint}`
    const options: RequestInit = {
      method,
      headers: {
        Authorization: this.generateAuthHeader(this.apiKey),
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }

    return fetch(url, options)
  }

  /**
   *  Create a ticket in Freshdesk
   * @param ticketData  The data to create a ticket
   * @example {
   *  description: "This is a test ticket",
   *  subject: "Test Ticket",
   *  email: "cool@email.com",
   * }
   * @returns  The ticket information for the created ticket
   */
  public async createTicket(ticketData: FreshdeskTicketBody): Promise<TicketResponse> {
    const completeTicketData = {
      ...this.getDefaultTicketData(),
      ...ticketData,
    }
    const response = await this.request({
      endpoint: "/tickets",
      method: "POST",
      body: completeTicketData,
    })

    if (!response.ok) {
      throw new Error(`Error creating ticket: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   *  Get a ticket by its ID
   * @param ticketId  The ID of the ticket to retrieve
   * @returns  The ticket information for the specified ticket ID
   */
  public async getTicketById(ticketId: number): Promise<TicketResponse> {
    const response = await this.request({
      endpoint: `/tickets/${ticketId}`,
    })

    if (!response.ok) {
      throw new Error(`Error fetching ticket: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get a ticket by the admin wallet address
   * @param walletAddress  The wallet address of the admin to search for
   * @returns The ticket information for the specified admin wallet address
   */
  public async getTicketByAdminWalletAddress(walletAddress: string): Promise<FreshdeskQueryResult<FreshdeskTicket>> {
    const freshdeskQuery = `cf_admin_wallet_address:'${walletAddress}' OR custom_string:'${walletAddress}'`
    const response = await this.request({
      endpoint: `/search/tickets?query="${freshdeskQuery}"`,
    })

    if (!response.ok) {
      throw new Error(`Error searching tickets: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all tickets from Freshdesk
   * @returns All tickets from Freshdesk specified by the API
   * **/
  public async getAllTickets(): Promise<TicketResponse[]> {
    const response = await this.request({
      endpoint: "/tickets",
    })

    if (!response.ok) {
      throw new Error(`Error fetching all tickets: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get the base URL for the Freshdesk API
   * @returns The base URL for the Freshdesk API
   */
  public getBaseUrl(): URL {
    return this.baseURL
  }

  /**
   * Generate the Authorization header value for Freshdesk
   * @param apiKey  The API key for Freshdesk
   * @returns  The Authorization header value
   */
  private generateAuthHeader(apiKey: string): string {
    const fakePasswordToFillEncoding = "X" // Placeholder to satisfy Basic Auth format
    const encodedKey = Buffer.from(`${apiKey}:${fakePasswordToFillEncoding}`).toString("base64")
    return `Basic ${encodedKey}`
  }

  /**
   * Get the default ticket data for creating a ticket
   * @returns Default ticket data
   */
  private getDefaultTicketData(): Omit<FreshdeskTicketBody, "description" | "subject" | "email"> {
    return {
      priority: this.DEFAULT_PRIORITY,
      status: this.DEFAULT_STATUS,
      type: this.DEFAULT_TYPE,
    }
  }
  // Function to map TicketStatus to HumanizedTicketStatus
  public getHumanizedTicketStatus = (status: TicketStatus): HumanizedTicketStatus => {
    switch (status) {
      case TicketStatus.Open:
        return HumanizedTicketStatus.Open
      case TicketStatus.Pending:
        return HumanizedTicketStatus.Pending
      case TicketStatus.Resolved:
        return HumanizedTicketStatus.Resolved
      case TicketStatus.Closed:
        return HumanizedTicketStatus.Closed
      case TicketStatus.WaitingOnCustomer:
        return HumanizedTicketStatus.WaitingOnCustomer
      case TicketStatus.WaitingOnDev:
        return HumanizedTicketStatus.WaitingOnDev
      default:
        return HumanizedTicketStatus.Unknown
    }
  }
}

export default FreshdeskClient
