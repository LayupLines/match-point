export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n')
  return lines.map(line => {
    // Simple CSV parser (handles basic cases)
    return line.split(',').map(cell => cell.trim())
  })
}

export function parsePlayersCSV(csvText: string) {
  const rows = parseCSV(csvText)

  // Skip header row
  const dataRows = rows.slice(1)

  return dataRows.map((row, index) => {
    if (row.length < 1) {
      throw new Error(`Row ${index + 2}: Missing required fields`)
    }

    const [name, seedStr, country] = row

    if (!name) {
      throw new Error(`Row ${index + 2}: Player name is required`)
    }

    return {
      name,
      seed: seedStr ? parseInt(seedStr, 10) : undefined,
      country: country || undefined
    }
  })
}

export function parseMatchesCSV(csvText: string) {
  const rows = parseCSV(csvText)

  // Skip header row
  const dataRows = rows.slice(1)

  return dataRows.map((row, index) => {
    if (row.length < 3) {
      throw new Error(`Row ${index + 2}: Missing required fields (roundNumber, player1Name, player2Name)`)
    }

    const [roundNumberStr, player1Name, player2Name] = row

    const roundNumber = parseInt(roundNumberStr, 10)

    if (isNaN(roundNumber)) {
      throw new Error(`Row ${index + 2}: Invalid round number`)
    }

    if (!player1Name || !player2Name) {
      throw new Error(`Row ${index + 2}: Both player names are required`)
    }

    return {
      roundNumber,
      player1Name,
      player2Name
    }
  })
}
