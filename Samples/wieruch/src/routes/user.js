import { Router } from 'express';
 
const router = Router();

// https://localhost:3000/user
router.get('/', (req, res) => {
  return res.send(Object.values(req.context.models.users));
});

// https://localhost:3000/user/:userId
router.get('/:userId', (req, res) => {
  return res.send(req.context.models.users[req.params.userId]);
});

export default router;