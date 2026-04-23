import { collection, addDoc, getDocs, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function saveMatch(matchData) {
  try {
    const { id: _id, ...data } = matchData
    await addDoc(collection(db, 'matches'), {
      ...data,
      createdAt: serverTimestamp(),
    })
  } catch { /* fire and forget */ }
}

export async function getMatches() {
  try {
    const q = query(collection(db, 'matches'), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch { return [] }
}

export async function uploadPlayerPhoto(file, playerId) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  if (!allowed.includes(file.type)) throw new Error('Solo se permiten imágenes JPG, PNG o WebP')
  if (file.size > 10 * 1024 * 1024) throw new Error('La imagen no puede superar 10MB')

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 400
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = () => reject(new Error('Error al leer la imagen'))
    img.src = objectUrl
  })
}