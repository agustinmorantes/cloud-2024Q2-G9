import { Injectable } from '@angular/core';
import {Observable, of, ReplaySubject, tap} from "rxjs";
import {OAuthClaims, OAuthFromCodeToken, OAuthFromRefreshToken} from "../../models/OAuth";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../../environments/environment";
import {jwtDecode} from "jwt-decode";
import {User} from "../../models/User";

export const NO_USER = "NO_USER" as const;

type NoUser = typeof NO_USER;

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedInUser = new ReplaySubject<User | NoUser>(1);

  constructor(private readonly httpClient: HttpClient) { }

  public getCodeGrantToken(code: string, redirect_uri: string): Observable<OAuthFromCodeToken> {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: environment.cognitoClientId,
      code,
      redirect_uri,
    });
    return this.httpClient.post<OAuthFromCodeToken>(environment.cognitoDomain + '/oauth2/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).pipe(tap((res) => {
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('id_token', res.id_token);
      localStorage.setItem('refresh_token', res.refresh_token);
      this.loggedInUser.next(this.parseIdToken(res.id_token));
    }));
  }

  public getRefreshGrantToken(refreshToken: string): Observable<OAuthFromRefreshToken> {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: environment.cognitoClientId,
      refresh_token: refreshToken,
    });
    return this.httpClient.post<OAuthFromRefreshToken>(environment.cognitoDomain + '/oauth2/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).pipe(tap((res) => {
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('id_token', res.id_token);
      this.loggedInUser.next(this.parseIdToken(res.id_token));
    }));
  }

  public pullUser(): void {
    const idToken = localStorage.getItem('id_token');
    if (idToken != null) {
      this.loggedInUser.next(this.parseIdToken(idToken));
    } else {
      this.loggedInUser.next(NO_USER);
    }
  }

  public logout(): Observable<void> {
    localStorage.clear();
    this.loggedInUser.next(NO_USER);
    return of();
  }

  private parseIdToken(idToken: string): User {
    const payload = jwtDecode<OAuthClaims>(idToken);
    return {
      id: payload.sub,
      email: payload.email
    };
  }

  public getAuthUser(): Observable<User | NoUser> {
    return this.loggedInUser.asObservable();
  }
}