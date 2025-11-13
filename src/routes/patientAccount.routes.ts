// src/routes/patientAccount.routes.ts
import { Router } from 'express'
import { getAccountSummary, listEntries, createEntry, deleteEntry } from '../controllers/patientAccount.controller'

const r = Router()

r.get('/patients/:id/account/summary', getAccountSummary)
r.get('/patients/:id/account/entries', listEntries)
r.post('/patients/:id/account/entries', createEntry)
r.delete('/patients/:id/account/entries/:entryId', deleteEntry)


export default r