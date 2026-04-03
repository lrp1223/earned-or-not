// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const { action, data } = event

  switch (action) {
    case 'initCollection':
      return await initCollection()
    case 'createRoom':
      return await createRoom(data)
    case 'joinRoom':
      return await joinRoom(data)
    case 'leaveRoom':
      return await leaveRoom(data)
    case 'addAI':
      return await addAI(data)
    case 'startGame':
      return await startGame(data)
    case 'playCard':
      return await playCard(data)
    case 'getRoom':
      return await getRoom(data)
    default:
      return { success: false, error: 'Unknown action' }
  }
}

// 初始化数据库集合
async function initCollection() {
  try {
    // 尝试创建集合（如果不存在）
    // 注意：云开发数据库集合需要手动创建或通过控制台创建
    // 这里我们尝试访问集合，如果不存在会返回错误
    
    // 先尝试获取集合信息
    const result = await db.collection('gongzhu_rooms').limit(1).get()
    
    return {
      success: true,
      message: '集合已存在或初始化成功',
      tip: '如果提示集合不存在，请在云开发控制台手动创建 gongzhu_rooms 集合'
    }
  } catch (err) {
    return {
      success: false,
      error: err.message,
      tip: '请在云开发控制台手动创建 gongzhu_rooms 集合：数据库 -> 添加集合 -> 输入 gongzhu_rooms'
    }
  }
}

// 创建房间
async function createRoom(data) {
  const { roomId, hostId, nickname, avatar } = data
  
  try {
    await db.collection('gongzhu_rooms').add({
      data: {
        _id: roomId,
        hostId: hostId,
        status: 'waiting',
        players: [{
          id: hostId,
          nickname: nickname || '玩家',
          avatar: avatar || '',
          isHost: true,
          isAI: false
        }],
        gameData: null,
        createdAt: db.serverDate()
      }
    })
    
    return { success: true, roomId }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 加入房间
async function joinRoom(data) {
  const { roomId, playerId, nickname, avatar } = data
  
  try {
    // 获取房间信息
    const roomRes = await db.collection('gongzhu_rooms').doc(roomId).get()
    const room = roomRes.data
    
    if (room.status !== 'waiting') {
      return { success: false, error: '游戏已开始' }
    }
    
    if (room.players.length >= 4) {
      return { success: false, error: '房间已满' }
    }
    
    // 添加玩家
    const newPlayer = {
      id: playerId,
      nickname: nickname || '玩家',
      avatar: avatar || '',
      isHost: false,
      isAI: false
    }
    
    await db.collection('gongzhu_rooms').doc(roomId).update({
      data: {
        players: _.push(newPlayer)
      }
    })
    
    return { success: true, playerIndex: room.players.length }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 离开房间
async function leaveRoom(data) {
  const { roomId, playerId } = data
  
  try {
    const roomRes = await db.collection('gongzhu_rooms').doc(roomId).get()
    const room = roomRes.data
    
    const newPlayers = room.players.filter(p => p.id !== playerId)
    
    if (newPlayers.length === 0) {
      // 房间无人，删除房间
      await db.collection('gongzhu_rooms').doc(roomId).remove()
    } else {
      // 更新玩家列表
      // 如果房主离开，转让房主
      if (room.hostId === playerId && newPlayers.length > 0) {
        const newHost = newPlayers.find(p => !p.isAI) || newPlayers[0]
        newHost.isHost = true
      }
      
      await db.collection('gongzhu_rooms').doc(roomId).update({
        data: {
          players: newPlayers,
          hostId: room.hostId === playerId ? newPlayers[0].id : room.hostId
        }
      })
    }
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 添加AI
async function addAI(data) {
  const { roomId, aiId, nickname, avatar } = data
  
  try {
    const roomRes = await db.collection('gongzhu_rooms').doc(roomId).get()
    const room = roomRes.data
    
    if (room.players.length >= 4) {
      return { success: false, error: '房间已满' }
    }
    
    const aiPlayer = {
      id: aiId,
      nickname: nickname || '机器人',
      avatar: avatar || '',
      isHost: false,
      isAI: true
    }
    
    await db.collection('gongzhu_rooms').doc(roomId).update({
      data: {
        players: _.push(aiPlayer)
      }
    })
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 开始游戏
async function startGame(data) {
  const { roomId, gameData } = data
  
  try {
    await db.collection('gongzhu_rooms').doc(roomId).update({
      data: {
        status: 'playing',
        gameData: gameData
      }
    })
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 出牌
async function playCard(data) {
  const { roomId, gameData } = data
  
  try {
    await db.collection('gongzhu_rooms').doc(roomId).update({
      data: {
        gameData: gameData
      }
    })
    
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// 获取房间信息
async function getRoom(data) {
  const { roomId } = data
  
  try {
    const roomRes = await db.collection('gongzhu_rooms').doc(roomId).get()
    return { success: true, data: roomRes.data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}