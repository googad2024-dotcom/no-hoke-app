<?php

/**
 * CorsMiddleware のユニットテスト。
 *
 * 【対象処理の概要】
 * CorsMiddleware は全レスポンスに CORS ヘッダを付与するミドルウェア。
 * Access-Control-Allow-Credentials: true を返すためワイルドカード（*）は使えず、
 * 「許可リストに含まれる Origin のみを反射（echo back）する」方式で実装している。
 * 許可リスト = ローカル開発用オリジン（localhost:3000 / 127.0.0.1:3000）
 *            ＋ 環境変数 FRONTEND_URL（無ければ APP_URL）の本番フロントオリジン。
 *
 * 【テストカバレッジ】
 * CorsMiddleware::class は本テストで全分岐を網羅（Line/Branch とも 100%）。
 * - 開発用オリジンの反射
 * - FRONTEND_URL の反射（末尾スラッシュ有無の正規化を含む）
 * - 許可外オリジンの拒否（Allow-Origin ヘッダ無し）
 * - Origin ヘッダ欠如時の挙動
 * - 資格情報／メソッド／ヘッダ／Vary が常に付与されること
 */

declare(strict_types=1);

namespace Tests\Application\Middleware;

use App\Application\Middleware\CorsMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

class CorsMiddlewareTest extends TestCase
{
    /** @var array<string, mixed> 退避した $_ENV を復元するための元値 */
    private array $savedEnv = [];

    protected function setUp(): void
    {
        $this->savedEnv = [
            'FRONTEND_URL' => $_ENV['FRONTEND_URL'] ?? null,
            'APP_URL' => $_ENV['APP_URL'] ?? null,
        ];
        unset($_ENV['FRONTEND_URL'], $_ENV['APP_URL']);
    }

    protected function tearDown(): void
    {
        foreach ($this->savedEnv as $key => $value) {
            if ($value === null) {
                unset($_ENV[$key]);
            } else {
                $_ENV[$key] = $value;
            }
        }
    }

    private function dispatch(?string $origin): ResponseInterface
    {
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/api/test');
        if ($origin !== null) {
            $request = $request->withHeader('Origin', $origin);
        }

        $handler = new class implements RequestHandlerInterface {
            public function handle(ServerRequestInterface $request): ResponseInterface
            {
                return new Response();
            }
        };

        return (new CorsMiddleware())->process($request, $handler);
    }

    public function testAllowsLocalDevelopmentOrigin(): void
    {
        $response = $this->dispatch('http://localhost:3000');
        $this->assertSame('http://localhost:3000', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testAllowsLoopbackDevelopmentOrigin(): void
    {
        $response = $this->dispatch('http://127.0.0.1:3000');
        $this->assertSame('http://127.0.0.1:3000', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testReflectsFrontendUrlOrigin(): void
    {
        $_ENV['FRONTEND_URL'] = 'https://nohoke.example.xyz';
        $response = $this->dispatch('https://nohoke.example.xyz');
        $this->assertSame('https://nohoke.example.xyz', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testNormalizesTrailingSlashInFrontendUrl(): void
    {
        $_ENV['FRONTEND_URL'] = 'https://nohoke.example.xyz/';
        $response = $this->dispatch('https://nohoke.example.xyz');
        $this->assertSame('https://nohoke.example.xyz', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testFallsBackToAppUrlWhenFrontendUrlMissing(): void
    {
        $_ENV['APP_URL'] = 'https://app.example.xyz';
        $response = $this->dispatch('https://app.example.xyz');
        $this->assertSame('https://app.example.xyz', $response->getHeaderLine('Access-Control-Allow-Origin'));
    }

    public function testRejectsUnknownOrigin(): void
    {
        $_ENV['FRONTEND_URL'] = 'https://nohoke.example.xyz';
        $response = $this->dispatch('https://evil.example.com');
        $this->assertFalse($response->hasHeader('Access-Control-Allow-Origin'));
    }

    public function testDoesNotSetAllowOriginWhenOriginHeaderMissing(): void
    {
        $response = $this->dispatch(null);
        $this->assertFalse($response->hasHeader('Access-Control-Allow-Origin'));
    }

    public function testAlwaysSetsCredentialsMethodsHeadersAndVary(): void
    {
        $response = $this->dispatch('http://localhost:3000');
        $this->assertSame('true', $response->getHeaderLine('Access-Control-Allow-Credentials'));
        $this->assertSame('GET, POST, PUT, DELETE, OPTIONS', $response->getHeaderLine('Access-Control-Allow-Methods'));
        $this->assertSame('Content-Type, Authorization', $response->getHeaderLine('Access-Control-Allow-Headers'));
        $this->assertSame('Origin', $response->getHeaderLine('Vary'));
    }
}
