import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { X, Target, Zap, Trophy } from 'lucide-react';
import { useUnlockBlog } from '@/hooks/useUnlockBlog';

interface UnlockAlphaProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (score: number) => void;
  blogTitle: string;
  blogId: string;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  points: number;
}

const UnlockAlpha = ({ isOpen, onClose, onComplete, blogTitle = "Exclusive Content", blogId = "" }: UnlockAlphaProps) => {
  const { unlockBlog } = useUnlockBlog(blogId && blogId.length > 0 ? blogId : 'skip');
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetId, setTargetId] = useState(0);
  const [streak, setStreak] = useState(0);
  const [missedClicks, setMissedClicks] = useState(0);

  const GAME_DURATION = 30; // 30 seconds
  const TARGET_LIFETIME = 2000; // 2 seconds per target
  const MAX_TARGETS = 3; // Maximum targets on screen
  const UNLOCK_THRESHOLD = 100; // Points needed to unlock

  // Generate random target
  const generateTarget = useCallback(() => {
    const gameArea = document.getElementById('game-area');
    if (!gameArea) return null;

    const rect = gameArea.getBoundingClientRect();
    const size = Math.random() * 30 + 40; // 40-70px size
    const x = Math.random() * (rect.width - size - 40) + 20;
    const y = Math.random() * (rect.height - size - 40) + 20;
    
    // Smaller targets are worth more points
    const points = Math.round((70 - size) * 2 + 10);

    return {
      id: targetId + 1,
      x,
      y,
      size,
      points
    };
  }, [targetId]);

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setTargets([]);
    setStreak(0);
    setMissedClicks(0);
    setTargetId(0);
  };

  // Click target
  const clickTarget = (target: Target, event: React.MouseEvent) => {
    event.stopPropagation();
    
    // Calculate bonus based on streak
    const streakBonus = Math.floor(streak / 3) * 5;
    const totalPoints = target.points + streakBonus;
    
    setScore(prev => prev + totalPoints);
    setStreak(prev => prev + 1);
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  // Miss click (clicked empty area)
  const missClick = () => {
    setMissedClicks(prev => prev + 1);
    setStreak(0); // Reset streak on miss
  };

  // Game timer effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  // Target spawning effect
  useEffect(() => {
    if (gameState !== 'playing') return;

    const spawnTimer = setInterval(() => {
      setTargets(prev => {
        if (prev.length < MAX_TARGETS) {
          const newTarget = generateTarget();
          if (newTarget) {
            setTargetId(newTarget.id);
            return [...prev, newTarget];
          }
        }
        return prev;
      });
    }, 800); // Spawn every 800ms

    return () => clearInterval(spawnTimer);
  }, [gameState, generateTarget]);

  // Target removal effect (lifetime)
  useEffect(() => {
    if (gameState !== 'playing') return;

    const removalTimer = setInterval(() => {
      setTargets(prev => {
        // Remove oldest target if any exist
        if (prev.length > 0) {
          return prev.slice(1);
        }
        return prev;
      });
    }, TARGET_LIFETIME);

    return () => clearInterval(removalTimer);
  }, [gameState]);

  // Handle game completion
  useEffect(() => {
    if (gameState === 'finished') {
      // Handle the unlock logic here
      const handleUnlock = async () => {
        if (score >= UNLOCK_THRESHOLD) {
          // Unlock the blog in the database
          const success = await unlockBlog(score);
          if (success) {
            // Wait a moment before calling onComplete
            setTimeout(() => {
              onComplete(score);
            }, 1000);
          } else {
            // If unlock failed, still call onComplete but with a lower score
            setTimeout(() => {
              onComplete(0);
            }, 1000);
          }
        } else {
          // Score too low, call onComplete with actual score
          setTimeout(() => {
            onComplete(score);
          }, 1000);
        }
      };

      handleUnlock();
    }
  }, [gameState, score, onComplete, unlockBlog]);

  const progressPercentage = (timeLeft / GAME_DURATION) * 100;
  const scorePercentage = Math.min((score / UNLOCK_THRESHOLD) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-blue bg-clip-text text-transparent">
            Unlock Alpha Challenge
          </DialogTitle>
          <DialogDescription className="text-lg">
            Score {UNLOCK_THRESHOLD}+ points to unlock: "{blogTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 p-6 pt-2">
          {gameState === 'waiting' && (
            <Card className="glass-card border-0 h-full flex items-center justify-center">
              <CardContent className="text-center space-y-6">
                <div className="space-y-4">
                  <Target className="h-16 w-16 mx-auto text-primary" />
                  <CardTitle className="text-2xl">Ready to Unlock?</CardTitle>
                  <CardDescription className="text-lg max-w-md">
                    Click on the targets as they appear. Smaller targets are worth more points. 
                    Build streaks for bonus points. You have {GAME_DURATION} seconds!
                  </CardDescription>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>Target: {UNLOCK_THRESHOLD} points to unlock</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span>Build streaks for bonus points</span>
                  </div>
                </div>
                
                <Button 
                  onClick={startGame}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-8 py-3 text-lg"
                >
                  Start Challenge
                </Button>
              </CardContent>
            </Card>
          )}

          {gameState === 'playing' && (
            <div className="h-full space-y-4">
              {/* Game Stats */}
              <div className="flex justify-between items-center">
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{score}</div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">{streak}</div>
                    <div className="text-sm text-muted-foreground">Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{timeLeft}s</div>
                    <div className="text-sm text-muted-foreground">Time</div>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Bars */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress to Unlock</span>
                  <span>{score}/{UNLOCK_THRESHOLD}</span>
                </div>
                <Progress value={scorePercentage} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Time Remaining</span>
                  <span>{timeLeft}s</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>

              {/* Game Area */}
              <div 
                id="game-area"
                className="relative bg-gradient-to-br from-background/50 to-background/80 rounded-lg h-80 overflow-hidden cursor-crosshair border-2 border-dashed border-primary/30"
                onClick={missClick}
              >
                {targets.map((target) => (
                  <button
                    key={target.id}
                    className="absolute rounded-full bg-gradient-to-br from-primary to-primary-blue hover:scale-110 transition-transform duration-200 shadow-lg cursor-pointer flex items-center justify-center text-white font-bold text-xs border-2 border-white/50"
                    style={{
                      left: target.x,
                      top: target.y,
                      width: target.size,
                      height: target.size,
                    }}
                    onClick={(e) => clickTarget(target, e)}
                  >
                    {target.points}
                  </button>
                ))}
                
                {targets.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    Get ready for targets...
                  </div>
                )}
              </div>
            </div>
          )}

          {gameState === 'finished' && (
            <Card className="glass-card border-0 h-full flex items-center justify-center">
              <CardContent className="text-center space-y-6">
                <div className="space-y-4">
                  {score >= UNLOCK_THRESHOLD ? (
                    <>
                      <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
                      <CardTitle className="text-2xl text-green-600">Challenge Complete!</CardTitle>
                      <CardDescription className="text-lg">
                        Congratulations! You scored {score} points and unlocked the blog!
                      </CardDescription>
                    </>
                  ) : (
                    <>
                      <Target className="h-16 w-16 mx-auto text-muted-foreground" />
                      <CardTitle className="text-2xl text-orange-600">So Close!</CardTitle>
                      <CardDescription className="text-lg">
                        You scored {score} points. You need {UNLOCK_THRESHOLD}+ to unlock the content.
                      </CardDescription>
                    </>
                  )}
                </div>
                
                <div className="flex justify-center gap-4">
                  {score < UNLOCK_THRESHOLD && (
                    <Button 
                      onClick={startGame}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      Try Again
                    </Button>
                  )}
                  <Button variant="outline" onClick={onClose}>
                    {score >= UNLOCK_THRESHOLD ? 'Continue' : 'Close'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnlockAlpha; 