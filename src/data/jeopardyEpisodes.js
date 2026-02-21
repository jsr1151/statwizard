const valueRows = {
    jeopardy: [200, 400, 600, 800, 1000],
    double: [400, 800, 1200, 1600, 2000],
    triple: [600, 1200, 1800, 2400, 3000]
};

const buildCategory = (episodeId, round, title, prompts, dailyDoubleIndex = null) => {
    const values = valueRows[round];
    return {
        id: `${episodeId}-${round}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title,
        clues: prompts.map((prompt, index) => ({
            id: `${episodeId}-${round}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index + 1}`,
            value: values[index],
            question: prompt.question,
            answer: prompt.answer,
            isDailyDouble: dailyDoubleIndex === index,
            tripleStumper: false
        }))
    };
};

const episodes = [
    {
        id: 'ep-101',
        season: 40,
        airDate: '2025-03-14',
        tags: ['science', 'history'],
        rounds: {
            jeopardy: [
                buildCategory('ep-101', 'jeopardy', 'World Capitals', [
                    { question: 'This city is the capital of Canada.', answer: 'What is Ottawa?' },
                    { question: 'The capital of Australia is this planned city.', answer: 'What is Canberra?' },
                    { question: 'This capital sits on the Vltava River in Czechia.', answer: 'What is Prague?' },
                    { question: 'Mongolia\'s capital is this city.', answer: 'What is Ulaanbaatar?' },
                    { question: 'This city is both a city-state and capital in Southeast Asia.', answer: 'What is Singapore?' }
                ], 3),
                buildCategory('ep-101', 'jeopardy', 'Physics Basics', [
                    { question: 'The SI unit of force.', answer: 'What is the newton?' },
                    { question: 'Light travels fastest in this medium.', answer: 'What is a vacuum?' },
                    { question: 'The scientist known for three laws of motion.', answer: 'Who is Isaac Newton?' },
                    { question: 'Energy of motion is called this.', answer: 'What is kinetic energy?' },
                    { question: 'The law stating energy cannot be created or destroyed.', answer: 'What is conservation of energy?' }
                ]),
                buildCategory('ep-101', 'jeopardy', 'Famous Novels', [
                    { question: 'George Orwell wrote this dystopian novel in 1949.', answer: 'What is 1984?' },
                    { question: 'Herman Melville wrote this whale of a tale.', answer: 'What is Moby-Dick?' },
                    { question: 'Pride and Prejudice author.', answer: 'Who is Jane Austen?' },
                    { question: 'This Harper Lee novel features Atticus Finch.', answer: 'What is To Kill a Mockingbird?' },
                    { question: 'The Great Gatsby author.', answer: 'Who is F. Scott Fitzgerald?' }
                ]),
                buildCategory('ep-101', 'jeopardy', 'US Geography', [
                    { question: 'The longest river in the United States.', answer: 'What is the Missouri River?' },
                    { question: 'The Grand Canyon is in this state.', answer: 'What is Arizona?' },
                    { question: 'This mountain is the highest in the contiguous US.', answer: 'What is Mount Whitney?' },
                    { question: 'The Great Salt Lake is in this state.', answer: 'What is Utah?' },
                    { question: 'This state is nicknamed the Land of 10,000 Lakes.', answer: 'What is Minnesota?' }
                ]),
                buildCategory('ep-101', 'jeopardy', 'Tech Terms', [
                    { question: 'CPU stands for this.', answer: 'What is Central Processing Unit?' },
                    { question: 'A network security barrier is called this.', answer: 'What is a firewall?' },
                    { question: 'The language most often used to style web pages.', answer: 'What is CSS?' },
                    { question: 'Open-source OS kernel started by Linus Torvalds.', answer: 'What is Linux?' },
                    { question: 'The acronym for Artificial Intelligence.', answer: 'What is AI?' }
                ]),
                buildCategory('ep-101', 'jeopardy', 'Music Legends', [
                    { question: 'The King of Pop.', answer: 'Who is Michael Jackson?' },
                    { question: 'Composer of the Moonlight Sonata.', answer: 'Who is Beethoven?' },
                    { question: 'The Beatles came from this city.', answer: 'What is Liverpool?' },
                    { question: 'This artist recorded Purple Rain.', answer: 'Who is Prince?' },
                    { question: 'She is known as the Queen of Soul.', answer: 'Who is Aretha Franklin?' }
                ])
            ],
            double: [
                buildCategory('ep-101', 'double', 'Ancient History', [
                    { question: 'This empire built Machu Picchu.', answer: 'What is the Inca Empire?' },
                    { question: 'The Rosetta Stone helped decode this script.', answer: 'What are hieroglyphics?' },
                    { question: 'The city buried by Vesuvius in 79 CE.', answer: 'What is Pompeii?' },
                    { question: 'This ruler led Macedon and conquered Persia.', answer: 'Who is Alexander the Great?' },
                    { question: 'The code named for this Babylonian king.', answer: 'Who is Hammurabi?' }
                ], 1),
                buildCategory('ep-101', 'double', 'Biology', [
                    { question: 'The powerhouse of the cell.', answer: 'What is the mitochondrion?' },
                    { question: 'DNA shape commonly described as this.', answer: 'What is a double helix?' },
                    { question: 'Process plants use to make sugar.', answer: 'What is photosynthesis?' },
                    { question: 'Basic unit of heredity.', answer: 'What is a gene?' },
                    { question: 'Organ system responsible for hormone release.', answer: 'What is the endocrine system?' }
                ]),
                buildCategory('ep-101', 'double', 'Movie Quotes', [
                    { question: '"May the Force be with you" is from this franchise.', answer: 'What is Star Wars?' },
                    { question: '"I\'ll be back" was said by this character.', answer: 'Who is the Terminator?' },
                    { question: '"You can\'t handle the truth!" is from this film.', answer: 'What is A Few Good Men?' },
                    { question: '"Here\'s looking at you, kid" appears in this classic.', answer: 'What is Casablanca?' },
                    { question: '"Why so serious?" is spoken by this villain.', answer: 'Who is the Joker?' }
                ]),
                buildCategory('ep-101', 'double', 'Math Concepts', [
                    { question: 'A polygon with eight sides.', answer: 'What is an octagon?' },
                    { question: 'The derivative of x².', answer: 'What is 2x?' },
                    { question: 'Value of pi rounded to two decimals.', answer: 'What is 3.14?' },
                    { question: 'A triangle with equal sides.', answer: 'What is an equilateral triangle?' },
                    { question: 'The branch of math dealing with uncertainty.', answer: 'What is probability?' }
                ]),
                buildCategory('ep-101', 'double', 'US Presidents', [
                    { question: 'First US president.', answer: 'Who is George Washington?' },
                    { question: 'President during the Civil War.', answer: 'Who is Abraham Lincoln?' },
                    { question: 'Only president to serve more than two terms.', answer: 'Who is Franklin D. Roosevelt?' },
                    { question: 'President associated with the New Frontier.', answer: 'Who is John F. Kennedy?' },
                    { question: 'He resigned during Watergate.', answer: 'Who is Richard Nixon?' }
                ]),
                buildCategory('ep-101', 'double', 'Space', [
                    { question: 'Planet known as the Red Planet.', answer: 'What is Mars?' },
                    { question: 'First human to walk on the Moon.', answer: 'Who is Neil Armstrong?' },
                    { question: 'Galaxy that contains our solar system.', answer: 'What is the Milky Way?' },
                    { question: 'Largest planet in our solar system.', answer: 'What is Jupiter?' },
                    { question: 'This telescope succeeded Hubble in 2021.', answer: 'What is the James Webb Space Telescope?' }
                ])
            ],
            triple: [],
            final: {
                category: 'Inventions',
                clue: 'Patented in 1876, this communication device transformed long-distance conversation.',
                answer: 'What is the telephone?'
            }
        }
    },
    {
        id: 'ep-102',
        season: 40,
        airDate: '2025-04-02',
        tags: ['literature', 'pop-culture'],
        rounds: {
            jeopardy: [
                buildCategory('ep-102', 'jeopardy', 'US Landmarks', [
                    { question: 'This New York landmark was gifted by France.', answer: 'What is the Statue of Liberty?' },
                    { question: 'The tallest mountain in North America.', answer: 'What is Denali?' },
                    { question: 'This memorial in DC honors a Civil War president.', answer: 'What is the Lincoln Memorial?' },
                    { question: 'The famous bridge connecting San Francisco to Marin.', answer: 'What is the Golden Gate Bridge?' },
                    { question: 'This South Dakota monument features four presidents.', answer: 'What is Mount Rushmore?' }
                ]),
                buildCategory('ep-102', 'jeopardy', 'Word Origins', [
                    { question: 'This language gave us the word "algebra."', answer: 'What is Arabic?' },
                    { question: 'A word for fear from Greek "phobos."', answer: 'What is phobia?' },
                    { question: 'The study of word origins is called this.', answer: 'What is etymology?' },
                    { question: 'Prefix "bio" relates to this.', answer: 'What is life?' },
                    { question: 'Suffix "-ology" means this study.', answer: 'What is the study of?' }
                ], 2),
                buildCategory('ep-102', 'jeopardy', 'Basketball', [
                    { question: 'NBA team based in Los Angeles with 17 titles.', answer: 'Who are the Lakers?' },
                    { question: 'Line worth three points in modern basketball.', answer: 'What is the three-point line?' },
                    { question: 'He is known as "His Airness."', answer: 'Who is Michael Jordan?' },
                    { question: 'Number of players per side on court.', answer: 'What is 5?' },
                    { question: 'This violation involves too many steps without dribbling.', answer: 'What is traveling?' }
                ]),
                buildCategory('ep-102', 'jeopardy', 'Ocean Life', [
                    { question: 'Largest animal known to have lived.', answer: 'What is the blue whale?' },
                    { question: 'These reef builders are tiny invertebrates.', answer: 'What are corals?' },
                    { question: 'Fish known for long migrations and pink flesh.', answer: 'What is salmon?' },
                    { question: 'Marine mammal famous for intelligence and echolocation.', answer: 'What is a dolphin?' },
                    { question: 'Ocean zone with no sunlight.', answer: 'What is the midnight zone?' }
                ]),
                buildCategory('ep-102', 'jeopardy', 'Broadway', [
                    { question: 'This musical features songs by ABBA.', answer: 'What is Mamma Mia!?' },
                    { question: 'Lin-Manuel Miranda wrote this hit about a founding father.', answer: 'What is Hamilton?' },
                    { question: 'This long-running musical features a masked protagonist.', answer: 'What is The Phantom of the Opera?' },
                    { question: 'The district known for NYC theater.', answer: 'What is Broadway?' },
                    { question: 'A short performance audition song is called this.', answer: 'What is a 16-bar cut?' }
                ]),
                buildCategory('ep-102', 'jeopardy', 'Computer Science', [
                    { question: 'Data structure with FIFO order.', answer: 'What is a queue?' },
                    { question: 'The process of finding and fixing software bugs.', answer: 'What is debugging?' },
                    { question: 'Binary digit abbreviation.', answer: 'What is a bit?' },
                    { question: 'This notation describes algorithm growth rate.', answer: 'What is Big O notation?' },
                    { question: 'Version control tool created by Linus Torvalds.', answer: 'What is Git?' }
                ])
            ],
            double: [],
            triple: [
                buildCategory('ep-102', 'triple', 'Hard Science', [
                    { question: 'The quantum number describing orbital shape.', answer: 'What is azimuthal (l)?' },
                    { question: 'Equation relating entropy and number of microstates.', answer: 'What is S = k ln W?' },
                    { question: 'This effect predicts time dilation at high velocities.', answer: 'What is special relativity?' },
                    { question: 'Branch of chemistry focused on carbon compounds.', answer: 'What is organic chemistry?' },
                    { question: 'A pH below 7 indicates this.', answer: 'What is acidic?' }
                ], 0),
                buildCategory('ep-102', 'triple', 'Classical Music', [
                    { question: 'Composer of The Four Seasons.', answer: 'Who is Vivaldi?' },
                    { question: 'This period followed the Baroque era.', answer: 'What is the Classical period?' },
                    { question: 'Instrument family of violins, violas, and cellos.', answer: 'What are strings?' },
                    { question: 'Mozart was born in this Austrian city.', answer: 'What is Salzburg?' },
                    { question: 'Symphony No. 9 with "Ode to Joy" by this composer.', answer: 'Who is Beethoven?' }
                ])
            ],
            final: {
                category: 'World Records',
                clue: 'This structure in Dubai has held the tallest-building title since 2010.',
                answer: 'What is Burj Khalifa?'
            }
        }
    }
];

const buildEpisodeIndex = (sourceEpisodes) => sourceEpisodes.map((episode) => ({
    id: episode.id,
    season: episode.season,
    airDate: episode.airDate,
    tags: episode.tags,
    categoryTitles: {
        jeopardy: episode.rounds.jeopardy.map((c) => c.title),
        double: episode.rounds.double.map((c) => c.title),
        triple: episode.rounds.triple.map((c) => c.title)
    },
    valueAmounts: valueRows
}));

const EPISODE_MAP = Object.fromEntries(episodes.map((episode) => [episode.id, episode]));
const EPISODE_INDEX = buildEpisodeIndex(episodes);

export { episodes as JEOPARDY_EPISODES, EPISODE_INDEX, EPISODE_MAP, valueRows };
