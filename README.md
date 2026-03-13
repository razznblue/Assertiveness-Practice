# 🚀 Assertiveness Practice
Many people struggle to speak up. In therapy, at work, in relationships, to themselves, or in any other situation. Assertiveness Practice is a free, open tool to help build that skill through low-pressure repetition. It gives you a random topic, a timer, and a space to just talk. You can do it alone or with a partner.

## How To Use
A topic and image is shown to you on the [home page](https://assertiveness-training.vercel.app/). Talk about the topic for the selected amount of time. When the timer runs out, the app will automatically display a new one. You can do this by yourself or with a partner! The timer is also customizable!

Screenshots:

<img width="1920" height="1080" alt="1" src="https://github.com/user-attachments/assets/aa7cb3f2-8023-40b2-9ad8-e243c6db8480" />
<img width="1920" height="1080" alt="2" src="https://github.com/user-attachments/assets/bca41d62-0d2a-41e1-9166-6bcea2d877eb" />
<img width="1920" height="1080" alt="3" src="https://github.com/user-attachments/assets/a6604e4c-9319-4bf7-829d-e8fc990c9a24" />
<img width="1920" height="1080" alt="4" src="https://github.com/user-attachments/assets/c3587f65-bc3f-4dbc-be81-dd6f0f3e6c5f" />
<img width="1920" height="1080" alt="5" src="https://github.com/user-attachments/assets/4759e7b4-b597-48a8-a25b-576f16627d0e" />


# Development Docs

## Routes
 - `/api/topic` - Returns a random topic from DB
 - `/api/process/names` - Processes any new names added to the list. Include an optional `size` parameter to specify the number of topics to process at a time. You can add a new name to the list [here](./data/topics.ts). More easier support for adding topics is on the way!

## Topics API
topics are processed from a file, to the database, setting the image by utilizing the unsplash apis. On the home page, it calls the db for a random topic displaying it to the user along with the image.

## Incoming Features
 - ✔️ Implement configurable timer for how long to speak about the topic(Implemented with [this commit](https://github.com/razznblue/assertiveness/commit/929b0a5a80bec5f9c2922747da38a5f1fd265472))
 - Record your speaking session
 - Rate your session
 - User session so data can be saved per user
