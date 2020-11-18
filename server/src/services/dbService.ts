import mongoose from 'mongoose';

export async function connect(mongoUrl: string) {
  await mongoose.connect(mongoUrl, {
    appname: 'timelogger',
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
    useCreateIndex: true,
  });
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));
  db.once('open', function () {
    console.log('Mongo connected.');
  });
  return db;
}
