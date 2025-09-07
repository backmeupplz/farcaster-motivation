import * as cron from 'node-cron'
import { createReadStream } from 'fs'
import { join } from 'path'
import csv from 'csv-parser'
import publishCast from './publishCast'

interface Quote {
  author: string
  quote: string
}

async function parseQuotesCSV(filePath: string): Promise<Quote[]> {
  return new Promise((resolve, reject) => {
    const quotes: Quote[] = []

    createReadStream(filePath)
      .pipe(csv())
      .on('data', (row: any) => {
        quotes.push({
          author: row.Author || '',
          quote: row.Quote || '',
        })
      })
      .on('end', () => {
        resolve(quotes)
      })
      .on('error', (error: any) => {
        reject(error)
      })
  })
}

function getRandomQuote(quotes: Quote[]): Quote {
  const randomIndex = Math.floor(Math.random() * quotes.length)
  return quotes[randomIndex]!
}

function formatQuote(quote: Quote): string {
  return quote.author ? `"${quote.quote}" — ${quote.author}` : quote.quote
}

async function main() {
  // Load quotes from the downloaded file
  const quotesPath = join(__dirname, 'quotes.json')
  const quotes = await parseQuotesCSV(quotesPath)

  console.log(`Loaded ${quotes.length} quotes`)

  // Schedule cron job
  cron.schedule('0 */8 * * *', () => {
    const randomQuote = getRandomQuote(quotes)
    const formattedQuote = formatQuote(randomQuote)
    return publishCast(formattedQuote)
  })
  const randomQuote = getRandomQuote(quotes)
  const formattedQuote = formatQuote(randomQuote)
  await publishCast(formattedQuote)

  console.log(
    'Quote cron job started. A random quote will be displayed every 8 hours.'
  )
  console.log('Press Ctrl+C to stop.')

  // Display an initial quote
  const initialQuote = getRandomQuote(quotes)
  console.log('\nInitial quote:')
  console.log(formatQuote(initialQuote))
}

main().catch(console.error)
