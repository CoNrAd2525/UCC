export default function handler(req, res) {
  res.status(200).json({ name: 'UCC API', version: '1.0.0' });
}