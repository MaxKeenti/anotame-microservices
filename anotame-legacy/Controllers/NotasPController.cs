using System;
using System.Collections.Generic;
using System.Data;
using System.Data.Entity;
using System.Linq;
using System.Net;
using System.Web;
using System.Web.Mvc;
using Anotame.Models;

namespace Anotame.Controllers
{
    public class NotasPController : Controller
    {
        private readonly AnotameEntities db = new AnotameEntities();

        // GET: NotasP
        public ActionResult Index()
        {
            var nota = db.Nota.Include(n => n.Clientes).Include(n => n.Empresa);
            return View(nota.ToList());
        }

        // GET: NotasP/Details/5
        public ActionResult Details(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            return View(nota);
        }

        // GET: NotasP/Create
        public ActionResult Create()
        {
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre");
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre");
            return View();
        }

        // POST: NotasP/Create
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Create([Bind(Include = "id,FechaEntrega,FechaRecibido,idEmpresa,Folio,idClientes,Total")] Nota nota)
        {
            if (ModelState.IsValid)
            {
                db.Nota.Add(nota);
                db.SaveChanges();
                return RedirectToAction("Index");
            }

            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            return View(nota);
        }

        // GET: NotasP/Edit/5
        public ActionResult Edit(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            return View(nota);
        }

        // POST: NotasP/Edit/5
        // Para protegerse de ataques de publicación excesiva, habilite las propiedades específicas a las que desea enlazarse. Para obtener 
        // más información vea https://go.microsoft.com/fwlink/?LinkId=317598.
        [HttpPost]
        [ValidateAntiForgeryToken]
        public ActionResult Edit([Bind(Include = "id,FechaEntrega,FechaRecibido,idEmpresa,Folio,idClientes,Total")] Nota nota)
        {
            if (ModelState.IsValid)
            {
                db.Entry(nota).State = EntityState.Modified;
                db.SaveChanges();
                return RedirectToAction("Index");
            }
            ViewBag.idClientes = new SelectList(db.Clientes, "id", "Nombre", nota.idClientes);
            ViewBag.idEmpresa = new SelectList(db.Empresa, "id", "Nombre", nota.idEmpresa);
            return View(nota);
        }

        // GET: NotasP/Delete/5
        public ActionResult Delete(int? id)
        {
            if (id == null)
            {
                return new HttpStatusCodeResult(HttpStatusCode.BadRequest);
            }
            Nota nota = db.Nota.Find(id);
            if (nota == null)
            {
                return HttpNotFound();
            }
            return View(nota);
        }

        // POST: NotasP/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public ActionResult DeleteConfirmed(int id)
        {
            Nota nota = db.Nota.Find(id);
            db.Nota.Remove(nota);
            db.SaveChanges();
            return RedirectToAction("Index");
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                db.Dispose();
            }
            base.Dispose(disposing);
        }
    }
}
