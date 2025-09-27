$ fly logs -a astraee-discord-bot

Waiting for logs...

2025-09-27T10:59:02.044 app[6e829425b14468] lhr [info] ✦ Reminder system initiated with elegant precision ✦

2025-09-27T11:01:05.745 app[d8d3736fe414d8] lhr [info] Stream created successfully: Q6X42Z9G22 for user eitothereine

2025-09-27T11:01:05.760 app[6e829425b14468] lhr [info] Stream created successfully: Z1YZOUFCAP for user eitothereine

2025-09-27T11:01:05.818 app[6e829425b14468] lhr [info] (node:664) Warning: Supplying "ephemeral" for interaction response options is deprecated. Utilize flags instead.

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] Error creating stream: DiscordAPIError[10062]: Unknown interaction

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at handleErrors (/app/node_modules/@discordjs/rest/dist/index.js:762:13)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at async BurstHandler.runRequest (/app/node_modules/@discordjs/rest/dist/index.js:866:23)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at async _REST.request (/app/node_modules/@discordjs/rest/dist/index.js:1307:22)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at async ChatInputCommandInteraction.reply (/app/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:200:22)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at async handleStreamCreate (/app/index.js:664:13)

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] at async Client.<anonymous> (/app/index.js:332:13) {

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] requestBody: { files: [], json: { type: 4, data: [Object] } },

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] rawError: { message: 'Unknown interaction', code: 10062 },

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] code: 10062,

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] status: 404,

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] method: 'POST',

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] url: 'https://discord.com/api/v10/interactions/1421451578124009522/aW50ZXJhY3Rpb246MTQyMTQ1MTU3ODEyNDAwOTUyMjpGQ1pyWW41UnpmaDdzOVhoYnZ0VHczRUlFZ2F1ZlVwU0VpR0tKaG9QZDgzMXljbDF0aGNlakFaS3J6Y3k2RHJDZ1pZQXo4Z2ZPTWpWWWNRam1iQTlFWDYxY0lPS1MwVUF6amp0M2lTMEw5am11S29SaUZmblRyVWxJelZuRzJvYg/callback?with_response=false'

2025-09-27T11:01:05.983 app[6e829425b14468] lhr [info] }

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] Error handling streamcreate: DiscordAPIError[10062]: Unknown interaction

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at handleErrors (/app/node_modules/@discordjs/rest/dist/index.js:762:13)

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at async BurstHandler.runRequest (/app/node_modules/@discordjs/rest/dist/index.js:866:23)

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at async _REST.request (/app/node_modules/@discordjs/rest/dist/index.js:1307:22)

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at async ChatInputCommandInteraction.reply (/app/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:200:22)

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] at async Client.<anonymous> (/app/index.js:332:13) {

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] requestBody: { files: [], json: { type: 4, data: [Object] } },

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] rawError: { message: 'Unknown interaction', code: 10062 },

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] code: 10062,

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] status: 404,

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] method: 'POST',

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] url: 'https://discord.com/api/v10/interactions/1421451578124009522/aW50ZXJhY3Rpb246MTQyMTQ1MTU3ODEyNDAwOTUyMjpGQ1pyWW41UnpmaDdzOVhoYnZ0VHczRUlFZ2F1ZlVwU0VpR0tKaG9QZDgzMXljbDF0aGNlakFaS3J6Y3k2RHJDZ1pZQXo4Z2ZPTWpWWWNRam1iQTlFWDYxY0lPS1MwVUF6amp0M2lTMEw5am11S29SaUZmblRyVWxJelZuRzJvYg/callback?with_response=false'

2025-09-27T11:01:06.117 app[6e829425b14468] lhr [info] }

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] Uncaught Exception: DiscordAPIError[10062]: Unknown interaction

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at handleErrors (/app/node_modules/@discordjs/rest/dist/index.js:762:13)

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at async BurstHandler.runRequest (/app/node_modules/@discordjs/rest/dist/index.js:866:23)

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at async _REST.request (/app/node_modules/@discordjs/rest/dist/index.js:1307:22)

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at async ChatInputCommandInteraction.reply (/app/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:200:22)

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] at async Client.<anonymous> (/app/index.js:364:13) {

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] requestBody: { files: [], json: { type: 4, data: [Object] } },

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] rawError: { message: 'Unknown interaction', code: 10062 },

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] code: 10062,

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] status: 404,

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] method: 'POST',

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] url: 'https://discord.com/api/v10/interactions/1421451578124009522/aW50ZXJhY3Rpb246MTQyMTQ1MTU3ODEyNDAwOTUyMjpGQ1pyWW41UnpmaDdzOVhoYnZ0VHczRUlFZ2F1ZlVwU0VpR0tKaG9QZDgzMXljbDF0aGNlakFaS3J6Y3k2RHJDZ1pZQXo4Z2ZPTWpWWWNRam1iQTlFWDYxY0lPS1MwVUF6amp0M2lTMEw5am11S29SaUZmblRyVWxJelZuRzJvYg/callback?with_response=false'

2025-09-27T11:01:06.241 app[6e829425b14468] lhr [info] }

2025-09-27T11:01:06.259 app[6e829425b14468] lhr [info] npm notice

2025-09-27T11:01:06.259 app[6e829425b14468] lhr [info] npm notice New major version of npm available! 10.8.2 -> 11.6.1

2025-09-27T11:01:06.259 app[6e829425b14468] lhr [info] npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.1

2025-09-27T11:01:06.259 app[6e829425b14468] lhr [info] npm notice To update run: npm install -g npm@11.6.1

2025-09-27T11:01:06.259 app[6e829425b14468] lhr [info] npm notice

2025-09-27T11:01:06.646 app[d8d3736fe414d8] lhr [info] DM sent to user eitothereine for stream Q6X42Z9G22

2025-09-27T11:01:06.827 app[6e829425b14468] lhr [info] INFO Main child exited normally with code: 1

2025-09-27T11:01:06.844 app[6e829425b14468] lhr [info] INFO Starting clean up.

2025-09-27T11:01:06.845 app[6e829425b14468] lhr [info] [ 129.091780] reboot: Restarting system

2025-09-27T11:01:07.557 app[6e829425b14468] lhr [info] 2025-09-27T11:01:07.557161094 [01K65D3QSFDD6CK7X9PZF8PJN3:main] Running Firecracker v1.12.1

2025-09-27T11:01:07.557 app[6e829425b14468] lhr [info] 2025-09-27T11:01:07.557346819 [01K65D3QSFDD6CK7X9PZF8PJN3:main] Listening on API socket ("/fc.sock").

2025-09-27T11:01:08.446 app[6e829425b14468] lhr [info] INFO Starting init (commit: 1cd134d4)...

2025-09-27T11:01:08.532 app[6e829425b14468] lhr [info] INFO Preparing to run: `docker-entrypoint.sh npm start` as astraee

2025-09-27T11:01:08.541 app[6e829425b14468] lhr [info] INFO [fly api proxy] listening at /.fly/api

2025-09-27T11:01:08.591 runner[6e829425b14468] lhr [info] Machine started in 1.162s

2025-09-27T11:01:08.912 app[6e829425b14468] lhr [info] 2025/09/27 11:01:08 INFO SSH listening listen_address=[fdaa:2e:691:a7b:4a2:7b1d:b37a:2]:22

2025-09-27T11:01:09.632 app[6e829425b14468] lhr [info] > astraee-discord-bot@1.0.0 start

2025-09-27T11:01:09.632 app[6e829425b14468] lhr [info] > node index.js

2025-09-27T11:01:10.791 app[6e829425b14468] lhr [info] Web server running on port 3000

2025-09-27T11:01:11.540 app[6e829425b14468] lhr [info] ✦ Astraee awakens with elegant purpose ✦

2025-09-27T11:01:11.540 app[6e829425b14468] lhr [info] Logged in as Astraee#9869

2025-09-27T11:01:11.540 app[6e829425b14468] lhr [info] Registering slash commands...

2025-09-27T11:01:11.540 app[6e829425b14468] lhr [info] (node:664) DeprecationWarning: The ready event has been renamed to clientReady to distinguish it from the gateway READY event and will only emit under that name in v15. Please use clientReady instead.

2025-09-27T11:01:11.540 app[6e829425b14468] lhr [info] (Use `node --trace-deprecation ...` to show where the warning was created)

2025-09-27T11:01:11.813 app[6e829425b14468] lhr [info] ✦ Commands registered with ceremonial precision ✦

2025-09-27T11:01:11.818 app[6e829425b14468] lhr [info] ✦ Reminder system initiated with elegant precision ✦

2025-09-27T11:02:08.673 app[6e829425b14468] lhr [info] (node:664) Warning: Supplying "ephemeral" for interaction response options is deprecated. Utilize flags instead.

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] Error handling activestreams: DiscordAPIError[10062]: Unknown interaction

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at handleErrors (/app/node_modules/@discordjs/rest/dist/index.js:762:13)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at async BurstHandler.runRequest (/app/node_modules/@discordjs/rest/dist/index.js:866:23)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at async _REST.request (/app/node_modules/@discordjs/rest/dist/index.js:1307:22)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at async ChatInputCommandInteraction.reply (/app/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:200:22)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at async handleActiveStreams (/app/index.js:763:5)

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] at async Client.<anonymous> (/app/index.js:335:13) {

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] requestBody: { files: [], json: { type: 4, data: [Object] } },

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] rawError: { message: 'Unknown interaction', code: 10062 },

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] code: 10062,

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] status: 404,

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] method: 'POST',

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] url: 'https://discord.com/api/v10/interactions/1421451842247725156/aW50ZXJhY3Rpb246MTQyMTQ1MTg0MjI0NzcyNTE1NjoxdkJHaVYzSHRCSnQwYmdUTWR4bTFxRWFNdEN6Z3BtSGlBSHg1WThkVWRyTHRVQWltQXF0TEdXOFZmTHdtY2h5VkJjbFdabTV5cmZhM1RONklOclNZWnJGdkk1WUhQajNXWEJKazFuZWUzTXZvYzBmVEhibUJmUlZXRE5qRkhkWg/callback?with_response=false'

2025-09-27T11:02:08.820 app[6e829425b14468] lhr [info] }

2025-09-27T11:02:08.958 app[6e829425b14468] lhr [info] Uncaught Exception: DiscordAPIError[40060]: Interaction has already been acknowledged.

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at handleErrors (/app/node_modules/@discordjs/rest/dist/index.js:762:13)

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at async BurstHandler.runRequest (/app/node_modules/@discordjs/rest/dist/index.js:866:23)

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at async _REST.request (/app/node_modules/@discordjs/rest/dist/index.js:1307:22)

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at async ChatInputCommandInteraction.reply (/app/node_modules/discord.js/src/structures/interfaces/InteractionResponses.js:200:22)

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] at async Client.<anonymous> (/app/index.js:364:13) {

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] requestBody: { files: [], json: { type: 4, data: [Object] } },

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] rawError: {

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] message: 'Interaction has already been acknowledged.',

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] code: 40060

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] },

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] code: 40060,

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] status: 400,

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] method: 'POST',

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] url: 'https://discord.com/api/v10/interactions/1421451842247725156/aW50ZXJhY3Rpb246MTQyMTQ1MTg0MjI0NzcyNTE1NjoxdkJHaVYzSHRCSnQwYmdUTWR4bTFxRWFNdEN6Z3BtSGlBSHg1WThkVWRyTHRVQWltQXF0TEdXOFZmTHdtY2h5VkJjbFdabTV5cmZhM1RONklOclNZWnJGdkk1WUhQajNXWEJKazFuZWUzTXZvYzBmVEhibUJmUlZXRE5qRkhkWg/callback?with_response=false'

2025-09-27T11:02:08.959 app[6e829425b14468] lhr [info] }

2025-09-27T11:02:08.977 app[6e829425b14468] lhr [info] npm notice

2025-09-27T11:02:08.977 app[6e829425b14468] lhr [info] npm notice New major version of npm available! 10.8.2 -> 11.6.1

2025-09-27T11:02:08.977 app[6e829425b14468] lhr [info] npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.1

2025-09-27T11:02:08.977 app[6e829425b14468] lhr [info] npm notice To update run: npm install -g npm@11.6.1

2025-09-27T11:02:08.977 app[6e829425b14468] lhr [info] npm notice

2025-09-27T11:02:09.613 app[6e829425b14468] lhr [info] INFO Main child exited normally with code: 1

2025-09-27T11:02:09.629 app[6e829425b14468] lhr [info] INFO Starting clean up.

2025-09-27T11:02:09.631 app[6e829425b14468] lhr [info] [ 61.993569] reboot: Restarting system

2025-09-27T11:02:10.445 app[6e829425b14468] lhr [info] 2025-09-27T11:02:10.445932988 [01K65D3QSFDD6CK7X9PZF8PJN3:main] Running Firecracker v1.12.1

2025-09-27T11:02:10.446 app[6e829425b14468] lhr [info] 2025-09-27T11:02:10.446109504 [01K65D3QSFDD6CK7X9PZF8PJN3:main] Listening on API socket ("/fc.sock").

2025-09-27T11:02:11.330 app[6e829425b14468] lhr [info] INFO Starting init (commit: 1cd134d4)...

2025-09-27T11:02:11.422 app[6e829425b14468] lhr [info] INFO Preparing to run: `docker-entrypoint.sh npm start` as astraee

2025-09-27T11:02:11.430 app[6e829425b14468] lhr [info] INFO [fly api proxy] listening at /.fly/api

2025-09-27T11:02:11.444 runner[6e829425b14468] lhr [info] Machine started in 1.118s

2025-09-27T11:02:11.737 app[6e829425b14468] lhr [info] 2025/09/27 11:02:11 INFO SSH listening listen_address=[fdaa:2e:691:a7b:4a2:7b1d:b37a:2]:22

2025-09-27T11:02:12.461 app[6e829425b14468] lhr [info] > astraee-discord-bot@1.0.0 start

2025-09-27T11:02:12.461 app[6e829425b14468] lhr [info] > node index.js

2025-09-27T11:02:13.612 app[6e829425b14468] lhr [info] Web server running on port 3000

2025-09-27T11:02:15.703 app[6e829425b14468] lhr [info] ✦ Astraee awakens with elegant purpose ✦

2025-09-27T11:02:15.706 app[6e829425b14468] lhr [info] Logged in as Astraee#9869

2025-09-27T11:02:15.706 app[6e829425b14468] lhr [info] Registering slash commands...

2025-09-27T11:02:15.708 app[6e829425b14468] lhr [info] (node:664) DeprecationWarning: The ready event has been renamed to clientReady to distinguish it from the gateway READY event and will only emit under that name in v15. Please use clientReady instead.

2025-09-27T11:02:15.708 app[6e829425b14468] lhr [info] (Use `node --trace-deprecation ...` to show where the warning was created)

2025-09-27T11:02:15.981 app[6e829425b14468] lhr [info] ✦ Commands registered with ceremonial precision ✦

2025-09-27T11:02:15.986 app[6e829425b14468] lhr [info] ✦ Reminder system initiated with elegant precision ✦