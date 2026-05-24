import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AsyncPipe, DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../../../shared/components/navbar/navbar.component';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoreRole } from '../../../core/models/store.model';
import {
  changeMemberRole, inviteMember,
  loadMembers, loadMyStores, loadStore,
  removeMember, updateStore,
} from '../../../store/stores/stores.actions';
import {
  selectMembersLoading, selectMyStores,
  selectSelectedStore, selectStoreMembers,
  selectStoresActionLoading, selectStoresError, selectStoresLoading,
} from '../../../store/stores/stores.selectors';
import { selectAuthUser } from '../../../store/auth/auth.selectors';
import { AuthUser } from '../../../store/auth/auth.actions';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, DatePipe, FormsModule, RouterLink, NavbarComponent],
  templateUrl: './store-detail.component.html',
  styleUrl: './store-detail.component.scss',
})
export class StoreDetailComponent implements OnInit, OnDestroy {
  private ngrx    = inject(Store);
  private route   = inject(ActivatedRoute);
  private subs    = new Subscription();

  storeId!: number;
  myRole: StoreRole | null = null;
  currentUser: AuthUser | null = null;

  store$          = this.ngrx.select(selectSelectedStore);
  members$        = this.ngrx.select(selectStoreMembers);
  loading$        = this.ngrx.select(selectStoresLoading);
  membersLoading$ = this.ngrx.select(selectMembersLoading);
  actionLoading$  = this.ngrx.select(selectStoresActionLoading);
  error$          = this.ngrx.select(selectStoresError);

  editing       = false;
  editName      = '';
  editDesc      = '';

  inviteUserId: number | null = null;
  inviteRole: StoreRole = 'STAFF';

  pendingRoles: Record<number, StoreRole | undefined> = {};

  ngOnInit() {
    this.storeId = Number(this.route.snapshot.paramMap.get('storeId'));

    this.subs.add(
      this.ngrx.select(selectMyStores).pipe(
        map(stores => stores.find(s => s.storeId === this.storeId)?.myRole ?? null)
      ).subscribe(role => this.myRole = role)
    );

    this.subs.add(
      this.ngrx.select(selectAuthUser).subscribe(u => this.currentUser = u)
    );

    this.ngrx.dispatch(loadMyStores());
    this.ngrx.dispatch(loadStore({ storeId: this.storeId }));
    this.ngrx.dispatch(loadMembers({ storeId: this.storeId }));
  }

  ngOnDestroy() { this.subs.unsubscribe(); }

  startEdit(name: string, description: string) {
    this.editName = name;
    this.editDesc = description ?? '';
    this.editing  = true;
  }

  saveEdit() {
    const req: { name?: string; description?: string } = {};
    if (this.editName.trim()) req.name = this.editName.trim();
    req.description = this.editDesc.trim();
    this.ngrx.dispatch(updateStore({ storeId: this.storeId, req }));
    this.editing = false;
  }

  invite() {
    if (!this.inviteUserId) return;
    this.ngrx.dispatch(inviteMember({ storeId: this.storeId, req: { userId: this.inviteUserId, role: this.inviteRole } }));
    this.inviteUserId = null;
    this.inviteRole   = 'STAFF';
  }

  applyRoleChange(membershipId: number) {
    const role = this.pendingRoles[membershipId] as StoreRole | undefined;
    if (!role) return;
    this.ngrx.dispatch(changeMemberRole({ storeId: this.storeId, membershipId, role }));
    delete this.pendingRoles[membershipId];
  }

  removeMemberById(membershipId: number) {
    if (!confirm('¿Remover a este miembro de la tienda?')) return;
    this.ngrx.dispatch(removeMember({ storeId: this.storeId, membershipId }));
  }

  isMe(memberEmail: string): boolean {
    return this.currentUser?.email === memberEmail;
  }

  canRemove(memberRole: StoreRole, memberEmail: string): boolean {
    const me = this.myRole;
    const isMe = this.isMe(memberEmail);
    if (me === 'OWNER') return true;
    if (me === 'MANAGER') return memberRole === 'STAFF';
    return isMe;
  }

  canChangeRole(memberEmail: string): boolean {
    return this.myRole === 'OWNER' && !this.isMe(memberEmail);
  }

  canEdit(): boolean {
    return this.myRole === 'OWNER' || this.myRole === 'MANAGER';
  }

  canInvite(): boolean {
    return this.myRole === 'OWNER' || this.myRole === 'MANAGER';
  }

  inviteableRoles(): StoreRole[] {
    return this.myRole === 'OWNER' ? ['OWNER', 'MANAGER', 'STAFF'] : ['STAFF'];
  }

  roleBadgeClass(role: StoreRole): string {
    return { OWNER: 'role-owner', MANAGER: 'role-manager', STAFF: 'role-staff' }[role] ?? '';
  }

  roleLabel(role: StoreRole): string {
    return { OWNER: 'Dueño', MANAGER: 'Manager', STAFF: 'Staff' }[role] ?? role;
  }
}
