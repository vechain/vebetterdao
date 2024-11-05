import axios, { AxiosInstance } from "axios"
type FreshdeskQueryResult = {
  results: FreshdeskTicketBody[]
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
    cf_app_description: string
    cf_app_url_optional?: string
    cf_github_username: string
    cf_x_username: string
    cf_admin_wallet_address: string
    cf_app_creator_email: string
    cf_app_creator_name_optional?: string
  }
}

export interface TicketResponse {
  id: number
  description: string
  subject: string
}

enum TicketPriority {
  Low = 1,
  Medium = 2,
  High = 3,
  Urgent = 4,
}
enum TicketStatus {
  Open = 2,
  Pending = 3,
  Resolved = 4,
  Closed = 5,
}

class FreshdeskClient {
  private apiClient: AxiosInstance
  private readonly baseURL: URL
  private readonly DEFAULT_PRIORITY = TicketPriority.Low // Low priority
  private readonly DEFAULT_STATUS = TicketStatus.Open // Open status
  private readonly DEFAULT_TYPE = "Other"

  constructor(apiKey: string, freshdeskDomain: string) {
    if (!apiKey) {
      throw new Error("API key is required")
    }
    if (!freshdeskDomain) {
      throw new Error("Freshdesk domain is required")
    }

    this.baseURL = new URL("/api/v2", freshdeskDomain)

    this.apiClient = axios.create({
      baseURL: this.baseURL.toString(),
      headers: {
        Authorization: this.generateAuthHeader(apiKey),
        "Content-Type": "application/json",
      },
    })
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

    const response = await this.apiClient.post("tickets", completeTicketData)
    return response.data
  }

  /**
   *  Get a ticket by its ID
   * @param ticketId  The ID of the ticket to retrieve
   * @returns  The ticket information for the specified ticket ID
   */
  public async getTicketById(ticketId: number): Promise<TicketResponse> {
    const response = await this.apiClient.get(`tickets/${ticketId}`)
    return response.data
  }

  /**
   * Get a ticket by the admin wallet address
   * @param walletAddress  The wallet address of the admin to search for
   * @returns The ticket information for the specified admin wallet address
   */
  public async getTicketByAdminWalletAddress(walletAddress: string): Promise<FreshdeskQueryResult> {
    const response = await this.apiClient.get(
      `search/tickets?query="cf_admin_wallet_address:'${walletAddress}' OR custom_string:'${walletAddress}'"`,
    )
    return response.data
  }

  /**
   * Get all tickets from Freshdesk
   * @returns All tickets from Freshdesk specified by the API
   * **/
  public async getAllTickets(): Promise<TicketResponse[]> {
    const response = await this.apiClient.get("tickets")
    return response.data
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
}

export default FreshdeskClient
