export interface Recipient {
  address: string
  amount: string
}

export interface RecipientInput {
  recipients: Recipient[]
}
