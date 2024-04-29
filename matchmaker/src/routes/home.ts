import { Request, Response, Router } from 'express'

const router = Router()
router.get('/', (req: Request, res: Response) => {
  res.json({ route: 'this is the home route' })
})

export default router
