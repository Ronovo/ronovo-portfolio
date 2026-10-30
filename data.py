SITE = {
    "name": "Ronovo",
    "tagline": "Self-hosted tools and browser games for tabletop players, OSRS players, and anyone who likes to tinker.",
    "intro": "I am Ian Kent, also known as Ronovo most places online.",

    # The Projects page groups projects under these, in this order. The home page shows each one's blurb.
    "categories": {
        "General": "Odds and ends that don't fit anywhere else",
        "TTRPG": "Tools for tabletop players and gamemasters.",
        "RuneScape": "Plugins and a OSRS Personal Tracker",
        "Games": "Various browser games I made",
    },

    # The theme picker shows these groups and themes in this order. Every theme but cyberpunk, the default,
    # has a block in static/brand.css.
    "themes": {
        "Standard": {"cyberpunk": "Cyberpunk", "light": "Light", "dark": "Dark"},
        "Experimental": {"terminal": "Terminal", "grimoire": "Grimoire", "blueprint": "Blueprint"},
    },

    # category is one of categories. Leave source, page and links out to show a card as "Coming soon".
    # thumb is optional, relative to static/, and shown at the top of the card. featured puts the card on the home page.
    # source is the GitHub repo. The About link goes to page, a folder under pages/ served at /projects/<page>/.
    # A link with port and subdomain points at https://<subdomain>.<PORTFOLIO_APP_DOMAIN>/, or at that port on the
    # host serving the site when PORTFOLIO_APP_DOMAIN is unset; one with run at the project's Run-it page; one with
    # url at that address.
    # app is the id the app logs in to the portfolio with. Its login token is only sent to its port link's address.
    "projects": [
        {
            "title": "Esoteric Chat",
            "featured": True,
            "category": "General",
            "app": "esoteric-chat",
            "desc": "A chat app that runs code in esoteric languages like Brainfart, HQ9+ and DeadSimple. Ported from my Discord bot.",
            "tags": ["Python", "Flask", "JavaScript", "Docker"],
            "source": "https://github.com/Ronovo/esoteric-chat",
            "page": "esoteric-chat",
            "links": [{"label": "Try it", "port": 8004, "subdomain": "esoteric-chat"}],
        },
        {
            "title": "Personal RuneScape Tracker",
            "featured": True,
            "category": "RuneScape",
            "app": "osrs-tracker",
            "desc": "A self-hosted Old School RuneScape dashboard.",
            "tags": ["TypeScript", "Node", "Docker"],
            "source": "https://github.com/Ronovo/Personal-RuneScape-Tracker",
            "page": "personal-runescape-tracker",
            "links": [{"label": "Try it", "port": 4123, "subdomain": "osrs-tracker"}],
        },
        {
            "title": "GM Toolbox",
            "category": "TTRPG",
            "app": "gm-toolbox",
            "desc": "A web toolkit for tabletop gamemasters: dice and card oracles, branching flows, and JSON import/export.",
            "tags": ["C#", "ASP.NET Core", "SQLite", "Docker"],
            "source": "https://github.com/Ronovo/Gamemaster-Toolbox",
            "page": "gamemaster-toolbox",
            "links": [{"label": "Try it", "port": 9000, "subdomain": "gm-toolbox"}],
        },
        {
            "title": "TTRPG Player Toolkit",
            "featured": True,
            "category": "TTRPG",
            "desc": "A browser table for tabletop players: 3D dice, playing card and tarot decks, a notepad and a Jenga tower, in ten styles.",
            "tags": ["JavaScript", "Docker"],
            "source": "https://github.com/Ronovo/ttrpg-player-toolkit",
            "page": "ttrpg-player-toolkit",
            "links": [{"label": "Try it", "port": 8006, "subdomain": "ttrpg-toolkit"}],
        },
        {
            "title": "TTRPG Adventure Blog",
            "category": "TTRPG",
            "desc": "An Obsidian overlay that publishes solo tabletop RPG play reports from your vault as a website.",
            "tags": ["JavaScript", "Node", "Docker"],
            "source": "https://github.com/Ronovo/ttrpg-adventure-blog",
            "page": "ttrpg-adventure-blog",
            "links": [{"label": "Example", "url": "https://soloronovo.com"}],
        },
        {
            "title": "Leagues Tasks",
            "category": "RuneScape",
            "desc": "A RuneLite plugin to track every task from past OSRS Leagues events. Pairs with Ronovo's Sync Tool to send them to the Personal RuneScape Tracker.",
            "tags": ["Java", "Plugin"],
            "source": "https://github.com/Ronovo/Leagues-Task-Plugin",
            "page": "leagues-task-plugin",
            "links": [{"label": "Try it", "run": True}],
        },
        {
            "title": "Ronovo's Sync Tool",
            "category": "RuneScape",
            "desc": "A RuneLite plugin that sends quests, diaries, combat achievements, the collection log and Leagues Tasks completions to the Personal RuneScape Tracker.",
            "tags": ["Java", "Plugin"],
            "source": "https://github.com/Ronovo/Ronovos-Sync-Tool",
            "page": "ronovos-sync-tool",
            "links": [{"label": "Try it", "run": True}],
        },
        {
            "title": "Ronovo's Casino",
            "category": "Games",
            "app": "casino",
            "desc": "Blackjack, Ultimate Texas Hold'em, baccarat, roulette, horse racing and more, with accounts, characters and achievements.",
            "tags": ["Python", "Flask", "JavaScript", "SQLite", "Docker"],
            "source": "https://github.com/Ronovo/Casino_Test",
            "page": "casino",
            "links": [{"label": "Play", "port": 8002, "subdomain": "casino"}],
        },
        {
            "title": "Space Station Explorer",
            "category": "Games",
            "app": "space-online",
            "desc": "A text-based exploration game on a space station: pick a job, manage power and oxygen, trade stocks, tend the bar and more.",
            "tags": ["Python", "Flask", "JavaScript", "SQLite","Docker"],
            "source": "https://github.com/Ronovo/online-space-station",
            "page": "space-station-explorer",
            "links": [{"label": "Play", "port": 8003, "subdomain": "space"}],
        },
        {
            "title": "Stand Alone Gun System",
            "category": "Games",
            "app": "gunsystem",
            "desc": "A text-based weapons system for games: an armory of 26 guns across 6 classes, a firing range with distance, dummy sizes and fire modes, and bulk-fire balance reports.",
            "tags": ["Python", "Flask", "JavaScript", "SQLite", "Docker"],
            "source": "https://github.com/Ronovo/standalonegunsystem",
            "page": "stand-alone-gun-system",
            "links": [{"label": "Play", "port": 8000, "subdomain": "gunsystem"}],
        },
        {
            "title": "Dead But Dreaming",
            "featured": True,
            "category": "Games",
            "app": "dead-but-dreaming",
            "desc": "An idle game where you play an Old One buried deep in the earth, dreaming cultists into gathering the sanity you need to devour the world and be reborn.",
            "tags": ["Python", "Flask", "JavaScript", "SQLite", "Docker"],
            "source": "https://github.com/Ronovo/Dead-But-Dreaming",
            "page": "dead-but-dreaming",
            "links": [{"label": "Play", "port": 8005, "subdomain": "dead-but-dreaming"}],
        },
        {
            "title": "Ronovo Portfolio",
            "category": "General",
            "desc": "The code this site is currently running on",
            "tags": ["Python", "Flask", "TypeScript", "SQLite", "Docker"],
            "source": "https://github.com/Ronovo/ronovo-portfolio",
        },
    ],
}
