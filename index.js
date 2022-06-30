const axios = require('axios');
const searchApi = axios.create({
    baseURL: 'https://search.battlefy.com/'
})
const tournamentApi = axios.create({
    baseURL: 'https://dtmwra1jsgyb0.cloudfront.net/'
})
const bfa = {
    getPopularGames: async () => {
        const response = await searchApi.get('game/popular');
        return response.data;
    },
    getGameTournaments: async (gameId) => {
        const response = await searchApi.get(`tournament/browse/${gameId}`);
        return response.data.tournaments;
    },
    getStaffPicks: async () => {
        const response = await searchApi.get(`spotlight?type=discovery`);
        return response.data;
    },
    getTournamentData: async (id) => {
        const response = await tournamentApi.get(`tournaments/${id}`);
        return response.data;
    },
    getTournamentStageData: async (stage) => {
        const response = await tournamentApi.get(`stages/${stage}`);
        return response.data;
    },
    getTournamentStageMatches: async (stage) => {
        const response = await tournamentApi.get(`stages/${stage}/matches`);
        for (match in response.data) {
            var winner = response.data[match].top.winner ? 'top' : 'bottom'
            response.data[match].winner = winner;
        }
        return response.data;
    },
    getTournamentTeams: async (id) => {
        const response = await tournamentApi.get(`tournaments/${id}/teams`);
        return response.data;
    }
}
const https = require('https');
const tID = ''; //Put tournament ID here https://battlefy.com/team-tsd/overunder-tetrio-doubles/<id>
const fs = require('fs');
function getPromise(path)
{
	return new Promise((resolve, reject) => {
		let req = https.get(path, (res) => {
			let data = ""; 
			res.on('data', (d) => {
				data += d;
			});  
			res.on('end', () => {
				resolve(JSON.parse(data));
			});
		})
		req.on('error', (e) => {
			reject(e);
		})
	})
}
teamGlicko = [];
bfa.getTournamentTeams(tID).then(async h => {
	for (const j of h)
	{
		teamGlicko[j.persistentTeam.name] = {};
		teamGlicko[j.persistentTeam.name].name = j.persistentTeam.name;
		teamGlicko[j.persistentTeam.name].score = 0;
		teamGlicko[j.persistentTeam.name].players = j.players;
		for (const i of j.players)
		{
			await getPromise(`https://ch.tetr.io/api/users/${String(i.inGameName).toLowerCase()}`)
				.then(l => {teamGlicko[j.persistentTeam.name].score += l.data.user.league.glicko ?? 0})
				.catch(c => console.log(`[VERBOSE] "${i.username}" IGN: "${i.inGameName}" doesn't exist`));
		}
	}
	var scoreCollective = Object.values(teamGlicko).sort(( a, b ) => b.score - a.score);
	var n = 0;
	var out = `"Seed","TeamName","TeamScore","Username1","Username2","Username3","IGN1","IGN2","IGN3"`;
	for (const ii of scoreCollective)
	{
		n++;
		out += `\n"${n}","${ii.name}","${ii.score}","${ii.players[0].username}","${ii.players[1].username}","${ii.players[2].username}","${ii.players[0].inGameName}","${ii.players[1].inGameName}","${ii.players[2].inGameName}"`;
	}
	console.log(out);
	fs.writeFileSync('./IFT_T_Seed.csv',out);
})