
// pages/api/analyzeAndStore.js
import { analyzeSentiment } from '../../utils/transformer';
import pineconeClient from '../../utils/pinecone'; 

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { professorId, review } = req.body;//will have to change this based on the type of data being received

    // Analyze sentiment
    const sentimentScore = analyzeSentiment(review);

    // Store in Pinecone-change based on the db schema
    await pineconeClient.upsert({
      indexName: 'professors-index',
      records: [
        {
          id: professorId,
          values: [sentimentScore],
        },
      ],
    });

    res.status(200).json({ success: true });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
