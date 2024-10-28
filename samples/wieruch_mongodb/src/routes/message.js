import { v4 as uuidv4 } from 'uuid';
import { Router } from 'express';
 
const router = Router();
 
// https://localhost:3000/messages
router.get('/', (req, res) => {
    return res.send(Object.values(req.context.models.messages));
});

// https://localhost:3000/messages/:messageId
router.get('/:messageId', (req, res) => {
    return res.send(req.context.models.messages[req.params.messageId]);
});

// https://localhost:3000/messages
router.post('/', (req, res) => {
    const id = uuidv4();
    const message = {
        id,
        text: req.body.text,
        userId: req.context.me.id,
    };

    req.context.models.messages[id] = message;

    return res.send(message);
});

// https://localhost:3000/messages/:messageId
router.delete('/:messageId', (req, res) => {
    const {
        [req.params.messageId]: message,
        ...otherMessages
    } = req.context.models.messages;

    req.context.models.messages = otherMessages;

    return res.send(message);
});

export default router;