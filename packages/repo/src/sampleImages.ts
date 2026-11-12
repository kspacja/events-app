/** Where the sample events' photos come from; set to 'picsum' for a random photo per event again. */
export const SAMPLE_IMAGE_SOURCE: 'commons' | 'picsum' = 'commons';

interface CommonsImage {
  readonly url: string;
  /** Author, licence and file, as the licences ask. */
  readonly credit: string;
}

const THUMB = 'https://thumb.wikimedia.org/wikipedia/commons/thumb';

// Ten free photos from Wikimedia Commons, rotated across the sample events; picsum.photos is slow to answer
const COMMONS_IMAGES: readonly CommonsImage[] = [
  {
    url: `${THUMB}/f/f4/Girl_singing_at_a_concert_at_school_Russia_2021.jpg/500px-Girl_singing_at_a_concert_at_school_Russia_2021.jpg`,
    credit: 'Andrew Krizhanovsky, public domain, File:Girl singing at a concert at school Russia 2021.jpg',
  },
  {
    url: `${THUMB}/3/30/Goa%2C_India_--_Little_girls_in_red%2C_at_a_school_concert_day.jpg/500px-Goa%2C_India_--_Little_girls_in_red%2C_at_a_school_concert_day.jpg`,
    credit: 'Fredericknoronha, CC BY-SA 4.0, File:Goa, India -- Little girls in red, at a school concert day.jpg',
  },
  {
    url: `${THUMB}/0/0a/-mypubliclandsroadtrip_2016-_Teacher_Approved%2C_Campbell_Creek_Science_Center_%2829297424470%29.jpg/500px--mypubliclandsroadtrip_2016-_Teacher_Approved%2C_Campbell_Creek_Science_Center_%2829297424470%29.jpg`,
    credit: 'mypubliclands (BLM), public domain, File:-mypubliclandsroadtrip 2016- Teacher Approved, Campbell Creek Science Center (29297424470).jpg',
  },
  {
    url: `${THUMB}/5/57/Workshops_at_the_Days_of_Science_2019.jpg/500px-Workshops_at_the_Days_of_Science_2019.jpg`,
    credit: 'Kateryna Kulish, CC BY 4.0, File:Workshops at the Days of Science 2019.jpg',
  },
  {
    url: `${THUMB}/6/6c/Hygiene_workshop_at_gurukul.jpg/500px-Hygiene_workshop_at_gurukul.jpg`,
    credit: 'Gauravmourya1234, CC BY-SA 4.0, File:Hygiene workshop at gurukul.jpg',
  },
  {
    url: `${THUMB}/6/62/Stage._Children%27s_Theatre_BAnQ_P48S1P12545.jpg/500px-Stage._Children%27s_Theatre_BAnQ_P48S1P12545.jpg`,
    credit: "Conrad Poirier, public domain, File:Stage. Children's Theatre BAnQ P48S1P12545.jpg",
  },
  {
    url: `${THUMB}/8/8d/Gate_City_High_School_at_NT_%2826983206323%29.jpg/500px-Gate_City_High_School_at_NT_%2826983206323%29.jpg`,
    credit: 'vastateparksstaff, CC BY 2.0, File:Gate City High School at NT (26983206323).jpg',
  },
  {
    url: `${THUMB}/3/3f/School_trip%2C_Parade%2C_Leamington%2C_March_2013_-_geograph.org.uk_-_5623059.jpg/500px-School_trip%2C_Parade%2C_Leamington%2C_March_2013_-_geograph.org.uk_-_5623059.jpg`,
    credit: 'Robin Stott, CC BY-SA 2.0, File:School trip, Parade, Leamington, March 2013 - geograph.org.uk - 5623059.jpg',
  },
  {
    url: `${THUMB}/0/00/Hogwarts_school_trip_-_geograph.org.uk_-_7603332.jpg/500px-Hogwarts_school_trip_-_geograph.org.uk_-_7603332.jpg`,
    credit: 'Richard Webb, CC BY-SA 2.0, File:Hogwarts school trip - geograph.org.uk - 7603332.jpg',
  },
  {
    url: `${THUMB}/9/9f/Worthington_High_School_senior_trip_to_New_York_City_-_DPLA_-_4f8b2ab55e082d742f99389c4a3a1936.jpg/500px-Worthington_High_School_senior_trip_to_New_York_City_-_DPLA_-_4f8b2ab55e082d742f99389c4a3a1936.jpg`,
    credit: 'Worthington Historical Society via DPLA, public domain, File:Worthington High School senior trip to New York City - DPLA - 4f8b2ab55e082d742f99389c4a3a1936.jpg',
  },
];

/** The photo of the sample event at `index` in the template list. */
export function sampleImageUrl(eventId: string, index: number): string {
  if (SAMPLE_IMAGE_SOURCE === 'picsum') return `https://picsum.photos/seed/${eventId}/480/208`;
  return COMMONS_IMAGES[index % COMMONS_IMAGES.length].url;
}
