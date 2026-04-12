import { app } from '@azure/functions';
import "./db/mongo";
app.setup({
    enableHttpStream: true,
});
