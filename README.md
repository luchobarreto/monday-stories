# Monday Stories

### Myself
Hi!. I'm Luciano. I'm fifteen, and I'm from Argentina. "Monday Stories" is a project which I worked on for six days for the Monday.com Hackathon. It's not the code I'm the proudest of. I could do it better with error handling and good practices, but there it is. I'm glad about what I did with the time I had. It was a fantastic experience, and I learned a lot from my first hackathon. Hope you like it!. All the feedback is really appreciated


### The project
Monday Stories is a social media app for the Monday.com hackathon to connect all the users of Monday.

In Monday Stories you can.

  - Upload Stories
  - Make Posts
  - Comment Posts

Technologies used to build Monday Stories

  - React
  - Firebase
  - Typescript

### Use It!

To use it just enter to https://monday-stories.web.app/ and register. (The 24hs stories deleting function doesn't work.)

### Installation

Monday Stories requires [Node.js](https://nodejs.org/) to run.

Follow the next steps.

  - Go to ```/monday-stories-app``` and run ```npm install```.
  - Go to ```../monday-stories-server``` and run ```npm install```.
  - Optional: Install [ngrok](https://ngrok.com/) running ```npm i -g ngrok```.
  - Go to ```/monday-stories-app/src/firebase.ts``` and update ```firebaseConfig``` with your firebase credentials.
  - Go to ```/monday-stories-app/src/components/CameraModal.tsx``` and update ```apiKey``` (Line 66) and ```apiSecret``` (Line 67) with your [Imagga](https://imagga.com/) credentials. 

Now you have everything set up.

To start the application follow the next steps in order.

  - Go to ```/monday-stories-server``` and run ```npm start```.
  - Open another terminal and go to ```../monday-stories-app``` and run ```npm run server```.
  - Optional: Open another terminal and go to ```../monday-stories-app``` and run ```npm run expose```.
