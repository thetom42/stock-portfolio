import { Router } from 'express';
 
const router = Router();
 
// https://localhost:3000/session
router.get('/', (req, res) => {
  return res.send(req.context.models.users[req.context.me.id]);
});
 
export default router;